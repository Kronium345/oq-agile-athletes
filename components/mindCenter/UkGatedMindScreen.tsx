import React, { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { useMindCenterUkScreenGuard } from '../../hooks/useMindCenterUkGate';
import { UkLocationModal } from './UkLocationModal';

type Props = {
  children: ReactNode;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
  style?: object;
};

export function UkGatedMindScreen({
  children,
  edges = ['top', 'left', 'right'],
  style,
}: Props) {
  const { checking, allowed, showModal, onSelectUk, onSelectNonUk } =
    useMindCenterUkScreenGuard();

  if (checking) {
    return (
      <SafeAreaView style={[styles.safe, style]} edges={edges}>
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.primary} size='large' />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={[styles.safe, style]} edges={edges}>
        {allowed ? children : null}
      </SafeAreaView>
      <UkLocationModal
        visible={showModal}
        onSelectUk={onSelectUk}
        onSelectNonUk={onSelectNonUk}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
