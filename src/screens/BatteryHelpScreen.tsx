import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { BigButton } from '../components/BigButton';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import {
  BATTERY_INSTRUCTIONS,
  openBatteryOptimizationSettings,
} from '../services/battery';
import { colors, fontSize, spacing } from '../theme';

interface BatteryHelpScreenProps {
  onBack: () => void;
}

/** Instruções de bateria por fabricante (nota técnica da seção 4). */
export function BatteryHelpScreen({ onBack }: BatteryHelpScreenProps) {
  return (
    <Screen title="Bateria e segundo plano" onBack={onBack}>
      <Card>
        <Text style={styles.body}>
          Alguns fabricantes de Android encerram apps em segundo plano para
          economizar bateria — e isso interrompe a escuta do Cadê?. Siga as
          instruções do seu aparelho para manter o app funcionando.
        </Text>
        <BigButton
          label="Abrir configurações de bateria"
          onPress={() => void openBatteryOptimizationSettings()}
        />
      </Card>

      {BATTERY_INSTRUCTIONS.map((manufacturer) => (
        <Card key={manufacturer.brand}>
          <Text style={styles.brand}>{manufacturer.brand}</Text>
          {manufacturer.steps.map((step, index) => (
            <Text key={index} style={styles.step}>
              {index + 1}. {step}
            </Text>
          ))}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 26,
    marginBottom: spacing.sm,
  },
  brand: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  step: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 26,
  },
});
