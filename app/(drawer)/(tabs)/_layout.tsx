import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from '../../../constants/layout';
import { COLORS, TYPOGRAPHY } from '../../../constants/theme';
import { useAuthContext } from '../../AuthProvider';

export default function TabsLayout() {
  const { user, isLoading } = useAuthContext();
  const insets = useSafeAreaInsets();
  const androidBottomInset = Math.max(insets.bottom, 12);

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Redirect href="/" />;
  }

  const tabBarHeight =
    Platform.OS === 'android'
      ? TAB_BAR_HEIGHT + androidBottomInset
      : TAB_BAR_HEIGHT;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneContainerStyle: styles.scene,
        tabBarStyle:
          Platform.OS === 'android'
            ? [
                styles.tabBar,
                {
                  height: tabBarHeight,
                  paddingBottom: androidBottomInset,
                },
              ]
            : styles.tabBar,
        tabBarActiveTintColor: COLORS.textPrimary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarBackground: () =>
          Platform.OS === 'android' ? (
            <View style={styles.tabBarBackgroundAndroid} />
          ) : (
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
  scene: {
    backgroundColor: COLORS.background,
  },
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
    backgroundColor: COLORS.background,
  },
  tabBarBackgroundAndroid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  tabLabel: {
    fontSize: TYPOGRAPHY.fontSize.small,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: 6,
  },
});

