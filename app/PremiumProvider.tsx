import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesPackage,
} from 'react-native-purchases';
import { useAuthContext } from './AuthProvider';

type Offerings = Awaited<ReturnType<typeof Purchases.getOfferings>>;

type PremiumContextValue = {
  isPremium: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  offerings: Offerings | null;
  refresh: () => Promise<void>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<void>;
};

const PremiumContext = createContext<PremiumContextValue | null>(null);

function getApiKey(): string | null {
  if (Platform.OS === 'ios')
    return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? null;
  if (Platform.OS === 'android')
    return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? null;
  return null;
}

function resolveAppUserId(user: unknown): string | null {
  if (!user || typeof user !== 'object') return null;
  const record = user as { _id?: string; userId?: string; id?: string };
  const id = record._id || record.userId || record.id;
  return id ? String(id) : null;
}

function hasPremiumEntitlement(info: CustomerInfo | null): boolean {
  const ent = info?.entitlements?.active?.premium;
  return Boolean(ent);
}

export default function PremiumProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuthContext();
  const [isConfigured, setIsConfigured] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<Offerings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const apiKey = getApiKey();
    if (!apiKey) {
      setIsLoading(false);
      return;
    }

    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
    Purchases.configure({ apiKey });
    setIsConfigured(true);
  }, []);

  useEffect(() => {
    if (!isConfigured) return;

    let isMounted = true;

    const syncUser = async () => {
      if (authLoading) {
        setIsLoading(true);
        return;
      }

      setIsLoading(true);
      const appUserID = resolveAppUserId(user);

      try {
        if (appUserID) {
          const { customerInfo: info } = await Purchases.logIn(appUserID);
          if (isMounted) setCustomerInfo(info);
        } else {
          try {
            const info = await Purchases.logOut();
            if (isMounted) setCustomerInfo(info);
          } catch {
            // Anonymous user — logOut is a no-op before first login
            const info = await Purchases.getCustomerInfo();
            if (isMounted) setCustomerInfo(info);
          }
        }
      } catch (error) {
        console.warn('RevenueCat identity sync failed:', error);
        try {
          const info = await Purchases.getCustomerInfo();
          if (isMounted) setCustomerInfo(info);
        } catch {
          // ignore
        }
      }

      try {
        const offs = await Purchases.getOfferings();
        if (isMounted) setOfferings(offs);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    syncUser();

    const listener = (info: CustomerInfo) => {
      setCustomerInfo(info);
    };
    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      isMounted = false;
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [isConfigured, user, authLoading]);

  const refresh = async () => {
    if (!isConfigured) return;
    setIsLoading(true);
    try {
      const [info, offs] = await Promise.all([
        Purchases.getCustomerInfo(),
        Purchases.getOfferings(),
      ]);
      setCustomerInfo(info);
      setOfferings(offs);
    } finally {
      setIsLoading(false);
    }
  };

  const purchasePackage = async (pkg: PurchasesPackage) => {
    if (!isConfigured)
      throw new Error('Purchases not configured (missing RevenueCat API key).');
    setIsLoading(true);
    try {
      const { customerInfo: info } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(info);
    } finally {
      setIsLoading(false);
    }
  };

  const restorePurchases = async () => {
    if (!isConfigured)
      throw new Error('Purchases not configured (missing RevenueCat API key).');
    setIsLoading(true);
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
    } finally {
      setIsLoading(false);
    }
  };

  const value = useMemo<PremiumContextValue>(
    () => ({
      isPremium: hasPremiumEntitlement(customerInfo),
      isLoading: isLoading || authLoading,
      customerInfo,
      offerings,
      refresh,
      purchasePackage,
      restorePurchases,
    }),
    [customerInfo, offerings, isLoading, authLoading],
  );

  return (
    <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>
  );
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be used within PremiumProvider');
  return ctx;
}
