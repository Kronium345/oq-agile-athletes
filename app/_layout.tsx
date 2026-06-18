import { ObserveRoot } from 'expo-observe';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { LogBox, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { AppAdsBootstrap } from '../components/AppAdsBootstrap';
import { AppObserveBootstrap } from '../components/AppObserveBootstrap';
import AppToast from '../components/AppToast';
import { COLORS } from '../constants/theme';
import useLastPage from '../hooks/useLastPage';
import AuthProvider from './AuthProvider';
import PremiumProvider from './PremiumProvider';
import { WorkoutContext } from './WorkoutContext';

void SplashScreen.preventAutoHideAsync().catch(() => { });

LogBox.ignoreLogs([
  'Failed to set an indexed property',
  'CSSStyleDeclaration',
  'Indexed property setter is not supported',
  'Uncaught TypeError: Failed to set an indexed property',
  'Unable to set cookie',
  'Event processing aborted during storage',
  'react-native-reanimated',
  'react-native-svg',
  'WebShape.js',
  'mapperRun',
  'styleUpdater',
  '@expo/vector-icons',
  'Ionicons',
  'expo-font',
  'font-face',
  'property [0] on',
  'property setter is not supported',
  'CSSStyleDeclaration: Indexed property',
  "Failed to set an indexed property [0] on 'CSSStyleDeclaration'",
  '[RevenueCat]',
  'PurchasesError',
  'RevenueCat identity sync failed',
]);

const toastGlobal = globalThis as any;
if (!toastGlobal.__oqToastBottomPatched) {
  const originalToastShow = Toast.show.bind(Toast);
  Toast.show = ((params: any) =>
    originalToastShow({
      position: 'bottom',
      ...params,
    })) as typeof Toast.show;
  toastGlobal.__oqToastBottomPatched = true;
}

function RootLayout() {
  useLastPage();

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void SystemUI.setBackgroundColorAsync(COLORS.background);
  }, []);

  return (
    <AuthProvider>
      <PremiumProvider>
        <AppAdsBootstrap />
        <AppObserveBootstrap />
        <WorkoutContext>
          <StatusBar style='dark' />
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
          <AppToast />
        </WorkoutContext>
      </PremiumProvider>
    </AuthProvider>
  );
}

export default ObserveRoot.wrap(RootLayout);

