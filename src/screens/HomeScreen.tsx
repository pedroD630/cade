import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { BigButton } from '../components/BigButton';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { colors, fontSize, spacing } from '../theme';

interface HomeScreenProps {
  onOpenSettings: () => void;
}

const SILENCE_OPTIONS = [
  { label: '30 min', ms: 30 * 60 * 1000 },
  { label: '1 hora', ms: 60 * 60 * 1000 },
  { label: '2 horas', ms: 2 * 60 * 60 * 1000 },
];

/** Tela principal: estado da escuta, toggle, silêncio temporizado e teste. */
export function HomeScreen({ onOpenSettings }: HomeScreenProps) {
  const {
    settings,
    status,
    silenceRemainingMs,
    updateSettings,
    silenceFor,
    cancelSilence,
    triggerAlarm,
  } = useApp();

  const greeting = settings.ownerName ? `Olá, ${settings.ownerName}!` : 'Cadê?';

  return (
    <Screen>
      <View style={styles.topRow}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Pressable
          onPress={onOpenSettings}
          accessibilityRole="button"
          accessibilityLabel="Abrir configurações"
          hitSlop={12}
        >
          <Text style={styles.gear}>⚙️</Text>
        </Pressable>
      </View>

      <StatusBadge status={status} silenceRemainingMs={silenceRemainingMs} />

      <Card>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Escuta ativada</Text>
          <Switch
            value={settings.listeningEnabled}
            onValueChange={(value) =>
              void updateSettings({ listeningEnabled: value, silencedUntil: null })
            }
            trackColor={{ false: colors.border, true: colors.primarySoft }}
            thumbColor={settings.listeningEnabled ? colors.primary : '#94A3B8'}
            accessibilityLabel="Ligar ou desligar a escuta"
          />
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Para chamar o celular, diga:</Text>
        <Text style={styles.phrase}>“{settings.phrase}”</Text>
      </Card>

      {settings.listeningEnabled && (
        <Card>
          {status === 'silenced' ? (
            <>
              <Text style={styles.cardTitle}>Escuta silenciada</Text>
              <BigButton
                label="Reativar agora"
                variant="secondary"
                onPress={() => void cancelSilence()}
              />
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>Silenciar por um período:</Text>
              <View style={styles.silenceRow}>
                {SILENCE_OPTIONS.map((option) => (
                  <Pressable
                    key={option.label}
                    style={styles.silenceChip}
                    onPress={() => void silenceFor(option.ms)}
                    accessibilityRole="button"
                    accessibilityLabel={`Silenciar por ${option.label}`}
                  >
                    <Text style={styles.silenceChipText}>{option.label}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </Card>
      )}

      <BigButton
        label="🔔 Testar o alarme agora"
        variant="secondary"
        onPress={() => void triggerAlarm()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.title,
    fontWeight: '900',
    color: colors.primary,
  },
  gear: {
    fontSize: 32,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  cardTitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  phrase: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.primaryDark,
    textAlign: 'center',
  },
  silenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  silenceChip: {
    flex: 1,
    backgroundColor: colors.silencedSoft,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  silenceChipText: {
    color: colors.silenced,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
