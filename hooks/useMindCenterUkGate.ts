import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';
import {
  getMindCenterInUk,
  isUkOnlyMindCenterRoute,
  NON_UK_MIND_CENTER_MESSAGE,
  setMindCenterInUk,
} from '../lib/mindCenterRegion';

export function useMindCenterUkGate() {
  const router = useRouter();
  const [inUk, setInUk] = useState<boolean | null>(null);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  const refreshPreference = useCallback(async () => {
    setInUk(await getMindCenterInUk());
  }, []);

  useEffect(() => {
    refreshPreference();
  }, [refreshPreference]);

  const showNonUkToast = useCallback(() => {
    Toast.show({
      type: 'info',
      ...NON_UK_MIND_CENTER_MESSAGE,
      position: 'bottom',
    });
  }, []);

  const navigateMindCenterRoute = useCallback(
    (nav: string) => {
      if (!isUkOnlyMindCenterRoute(nav)) {
        router.push(`/${nav}` as any);
        return;
      }

      if (inUk === false) {
        showNonUkToast();
        return;
      }

      if (inUk === true) {
        router.push(`/${nav}` as any);
        return;
      }

      setPendingRoute(nav);
      setLocationModalVisible(true);
    },
    [inUk, router, showNonUkToast],
  );

  const onSelectUk = useCallback(async () => {
    await setMindCenterInUk(true);
    setInUk(true);
    setLocationModalVisible(false);
    if (pendingRoute) {
      router.push(`/${pendingRoute}` as any);
      setPendingRoute(null);
    }
  }, [pendingRoute, router]);

  const onSelectNonUk = useCallback(async () => {
    await setMindCenterInUk(false);
    setInUk(false);
    setLocationModalVisible(false);
    if (pendingRoute) {
      showNonUkToast();
      setPendingRoute(null);
    }
  }, [pendingRoute, showNonUkToast]);

  const promptLocationIfUnset = useCallback(() => {
    if (inUk === null) {
      setLocationModalVisible(true);
    }
  }, [inUk]);

  return {
    inUk,
    locationModalVisible,
    setLocationModalVisible,
    navigateMindCenterRoute,
    onSelectUk,
    onSelectNonUk,
    showNonUkToast,
    promptLocationIfUnset,
    refreshPreference,
  };
}

/** Block UK-only screens when user chose "not in UK". */
export function useMindCenterUkScreenGuard() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const finishDenied = useCallback(() => {
    Toast.show({
      type: 'info',
      ...NON_UK_MIND_CENTER_MESSAGE,
      position: 'bottom',
    });
    if (router.canGoBack()) {
      router.back();
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const pref = await getMindCenterInUk();
      if (cancelled) return;

      if (pref === true) {
        setAllowed(true);
        setChecking(false);
        return;
      }

      if (pref === false) {
        setAllowed(false);
        setChecking(false);
        finishDenied();
        return;
      }

      setShowModal(true);
      setChecking(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [finishDenied]);

  const onSelectUk = async () => {
    await setMindCenterInUk(true);
    setShowModal(false);
    setAllowed(true);
  };

  const onSelectNonUk = async () => {
    await setMindCenterInUk(false);
    setShowModal(false);
    finishDenied();
  };

  return {
    checking,
    allowed,
    showModal,
    onSelectUk,
    onSelectNonUk,
  };
}
