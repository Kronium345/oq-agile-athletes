import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../../../constants/theme';

export default function TabsLayout() {
  const { isLoaded, isSignedIn, getToken } = useAuth({
    treatPendingAsSignedOut: false,
  });
  const [isAuthResolved, setIsAuthResolved] = useState(false);

  useEffect(() => {
    let active = true;

    const resolveAuth = async () => {
      if (!isLoaded) {
        return;
      }

      if (isSignedIn === true) {
        if (active) setIsAuthResolved(true);
        return;
      }

      if (isSignedIn === false) {
        try {
          // Guard against transient false during session restore.
          const token = await getToken();
          if (!active) return;
          if (token) {
            setIsAuthResolved(true);
            return;
          }
        } catch {
          // No-op: fall through to signed-out state.
        }
        if (active) setIsAuthResolved(true);
      }
    };

    resolveAuth();
    return () => {
      active = false;
    };
  }, [getToken, isLoaded, isSignedIn]);

  if (!isLoaded || !isAuthResolved) {
    return null;
  }

  if (isSignedIn === false) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: Platform.OS === 'android'
          ? [styles.tabBar, styles.tabBarAndroid]
          : styles.tabBar,
        tabBarActiveTintColor: COLORS.textButton,
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        tabBarLabelStyle: styles.tabLabel,
        tabBarBackground: () => (
          <LinearGradient
            colors={[COLORS.primaryDark, COLORS.background]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={22}
              color={color}
            />
          ),
          tabBarLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'barbell' : 'barbell-outline'}
              size={22}
              color={color}
            />
          ),
          tabBarLabel: 'Exercises',
        }}
      />
      <Tabs.Screen
        name="stepCount"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'walk' : 'walk-outline'}
              size={22}
              color={color}
            />
          ),
          tabBarLabel: 'Steps',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={color}
            />
          ),
          tabBarLabel: 'Profile',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 0,
    borderTopWidth: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: 70,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
  },
  tabBarAndroid: {
    bottom: 40,
  },
  tabLabel: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: 6,
  },
});

