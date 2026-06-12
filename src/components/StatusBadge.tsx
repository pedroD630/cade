import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '../theme';
import { ListeningStatus } from '../types';
import { formatRemaining } from '../utils/time';

interface StatusBadgeProps {
  status: ListeningStatus;
  silenceRemainingMs: number | null;
}

const STATUS_CONFIG: Record<
  ListeningStatus,
  { emoji: string; label: string; bg: string; fg: string }
> = {
  listening: {
    emoji: '👂',
    label: 'Ouvindo',
    bg: colors.successSoft,
    fg: colors.success,
  },
  off: {
    emoji: '😴',
    label: 'Escuta desligada',
    bg: colors.border,
    fg: colors.textSecondary,
  },
  silenced: {
    emoji: '🔕',
    label: 'Silenciado',
    bg: colors.silencedSoft,
    fg: colors.silenced,
  },
  ringing: {
    emoji: '📢',
    label: 'Tocando!',
    bg: colors.dangerSoft,
    fg: colors.danger,
  },
  'no-permission': {
    emoji: '🎤',
    label: 'Sem permissão de microfone',
    bg: colors.dangerSoft,
    fg: colors.danger,
  },
  unavailable: {
    emoji: '⚠️',
    label: 'Reconhecimento de voz indisponível',
    bg: colors.dangerSoft,
    fg: colors.danger,
  },
};

/** Indicador visual grande e inequívoco do estado atual da escuta (F08, S04). */
export function StatusBadge({ status, silenceRemainingMs }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={styles.emoji}>{config.emoji}</Text>
      <Text style={[styles.label, { color: config.fg }]}>{config.label}</Text>
      {status === 'silenced' && silenceRemainingMs !== null && (
        <Text style={[styles.sublabel, { color: config.fg }]}>
          Volta a ouvir em {formatRemaining(silenceRemainingMs)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    textAlign: 'center',
  },
  sublabel: {
    marginTop: spacing.xs,
    fontSize: fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
  },
});
