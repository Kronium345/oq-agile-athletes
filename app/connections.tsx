import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import BackgroundGradient from '../components/BackgroundGradient';
import { COLORS } from '../constants/theme';
import {
  buildConnectionsDestination,
  buildConnectionsReturnPath,
} from '../lib/linking/appLinks';
import { useAuthContext } from './AuthProvider';

/**
 * Universal / App Link + custom scheme entry:
 *   https://agile-athletes.expo.app/connections?requestId=...
 *   oqagileathletes://connections?requestId=...
 */
export default function ConnectionsDeepLinkScreen() {
  const { requestId } = useLocalSearchParams<{ requestId?: string }>();
  const { user, isLoading } = useAuthContext();
  const returnPath = buildConnectionsReturnPath(
    requestId ? String(requestId) : undefined,
  );

  if (isLoading) {
    return (
      <BackgroundGradient>
        <View style={styles.loader}>
          <ActivityIndicator size='large' color={COLORS.primary} />
        </View>
      </BackgroundGradient>
    );
  }

  if (!user) {
    return (
      <Redirect
        href={`/sign-in?returnTo=${encodeURIComponent(returnPath)}` as const}
      />
    );
  }

  const destination = buildConnectionsDestination(
    requestId ? String(requestId) : undefined,
  );

  return <Redirect href={destination as '/(drawer)/community/connections'} />;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
