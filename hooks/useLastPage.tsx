import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';

/**
 * Hook to track and save the last visited page/route.
 * Saves the current route to AsyncStorage whenever the route changes.
 * 
 * @returns null (no return value, side-effect only)
 * 
 * @example
 * // Use in root layout or app component
 * useLastPage();
 */
const useLastPage = () => {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const saveLastPage = async () => {
      try {
        if (pathname && pathname !== '/') {
          await AsyncStorage.setItem('lastPage', pathname);
        }
      } catch (error) {
        console.error('Error saving last page:', error);
      }
    };

    // Save on route change
    saveLastPage();
  }, [pathname]);

  return null;
};

export default useLastPage;
