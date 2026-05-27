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
  customerInfo: CustomerInfo | null;
  offerings: Offerings | null;
  isLoading: boolean;
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

function hasPremiumEntitlement(info: CustomerInfo | null): boolean {
  const ent = info?.entitlements?.active?.premium;
  return Boolean(ent);
}

export default function PremiumProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();
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
      const appUserID = (user as any)?._id || (user as any)?.userId || null;
      try {
        if (appUserID) {
          await Purchases.logIn(String(appUserID));
        } else {
          await Purchases.logOut();
        }
      } catch {}

      try {
        const [info, offs] = await Promise.all([
          Purchases.getCustomerInfo(),
          Purchases.getOfferings(),
        ]);
        if (!isMounted) return;
        setCustomerInfo(info);
        setOfferings(offs);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    syncUser();

    Purchases.addCustomerInfoUpdateListener((info) => {
      setCustomerInfo(info);
    });

    return () => {
      isMounted = false;
    };
  }, [isConfigured, user]);

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
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(customerInfo);
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
      customerInfo,
      offerings,
      isLoading,
      refresh,
      purchasePackage,
      restorePurchases,
    }),
    [customerInfo, offerings, isLoading],
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
