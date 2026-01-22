import { isAuthenticated } from '@/components/lib/actions/auth.action';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import tw from 'twrnc';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const checkAuth = async () => {
        try {
          const authStatus = await isAuthenticated();
          if (isActive) {
            setIsAuth(authStatus);
            setLoading(false);
          }
        } catch (error) {
        }
      };

      checkAuth();

      return () => {
        isActive = false;
      };
    }, [])
  );

  useEffect(() => {
    if (!loading && isAuth) {
      router.replace('/home' as any);
    }
  }, [loading, isAuth, router]);

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-black`}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (isAuth) {
    return null;
  }

  return (
    <View style={tw`flex-1 bg-black justify-center items-center p-6`}>
      <View style={tw`items-center mb-12`}>
        <Text style={tw`text-white text-3xl font-bold mb-2`}></Text>
        <Text style={tw`text-white text-5xl mb-4`}>🎯</Text>
        <Text style={tw`text-gray-400 text-center text-lg mb-8`}>
          Welcome to Agile Athletes - Let's Get Our Sweat On!
        </Text>
      </View>

      <View style={tw`w-full gap-4`}>
        <TouchableOpacity
          style={tw`bg-[#6366f1] py-4 rounded-xl w-full items-center`}
          onPress={() => {
            console.log('Navigating to Sign In...');
            router.push('/sign-in');
          }}
        >
          <Text style={tw`text-white font-bold text-lg`}>SIGN IN</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={tw`border border-[#6366f1] py-4 rounded-xl w-full items-center`}
          onPress={() => {
            console.log('Navigating to Sign Up...');
            router.push('/sign-up');
          }}
        >
          <Text style={tw`text-[#6366f1] font-bold text-lg`}>SIGN UP</Text>
        </TouchableOpacity>
      </View>

      <Text style={tw`text-gray-500 mt-12 text-center`}>
        Practice interviews with AI and get real-time feedback
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
});