import React from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';

import { useApp } from '../context/AppContext';
import { colors, fontSize, spacing } from '../theme';

/**
 * Tela cheia exibida enquanto o alarme toca. Qualquer toque para o som (F03/S01).
 * Renderizada na raiz do app para cobrir qualquer tela.
 */
export function RingingOverlay() {
  const { status, settings, stopRinging } = useApp();
  const visible = status === 'ringing';

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <Pressable
        style={styles.container}
        onPress={() => void stopRinging()}
        accessibilityRole="button"
        accessibilityLabel="Parar o alarme"
      >
        <Text style={styles.emoji}>📢</Text>
        <Text style={styles.title}>
          {settings.ownerName ? `Estou aqui, ${settings.ownerName}!` : 'Estou aqui!'}
        </Text>
        <Text style={styles.instruction}>Toque em qualquer lugar para parar</Text>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emoji: {
    fontSize: 110,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: '900',
    color: '#1C1917',
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  instruction: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: '#44403C',
    textAlign: 'center',
  },
});
