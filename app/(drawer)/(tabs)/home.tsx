import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function HomeTab() {
  const router = useRouter();

  useEffect(() => {
  const timer = setTimeout(() => {
    router.replace('../../home' as any);
  }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

