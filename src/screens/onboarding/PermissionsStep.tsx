import React, { useEffect, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';

import { BigButton } from '../../components/BigButton';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { useApp } from '../../context/AppContext';
import {
  BATTERY_INSTRUCTIONS,
  openBatteryOptimizationSettings,
} from '../../services/battery';
import { requestMicPermission } from '../../services/permissions';
import { colors, fontSize, radius, spacing } from '../../theme';

interface PermissionsStepProps {
  onContinue: () => void;
  onBack: () => void;
}

/**
 * Tela 2 — Permissões. Sem botão "pular": a permissão de microfone é
 * obrigatória para o app funcionar (regra de onboarding da seção 6).
 */
export function PermissionsStep({ onContinue, onBack }: PermissionsStepProps) {
  const { micGranted, refreshMicPermission } = useApp();
  const [denied, setDenied] = useState(false);
  const [showBattery, setShowBattery] = useState(false);

  useEffect(() => {
    void refreshMicPermission();
  }, [refreshMicPermission]);

  const handleRequest = async () => {
    const granted = await requestMicPermission();
    await refreshMicPermission();
    setDenied(!granted);
  };

  return (
    <Screen onBack={onBack}>
      <Text style={styles.title}>Permissão de microfone</Text>
      <Text style={styles.body}>
        O Cadê? precisa do microfone para reconhecer a frase de ativação.
      </Text>

      <Card style={styles.privacyCard}>
        <Text style={styles.privacyText}>
          🔒 Seu áudio nunca é gravado nem enviado.{'\n'}
          Todo o reconhecimento acontece dentro do seu celular.
        </Text>
      </Card>

      {micGranted ? (
        <Card style={styles.grantedCard}>
          <Text style={styles.grantedText}>✅ Microfone permitido!</Text>
        </Card>
      ) : (
        <BigButton label="Permitir microfone" onPress={() => void handleRequest()} />
      )}

      {denied && !micGranted && (
        <Card>
          <Text style={styles.deniedText}>
            Sem essa permissão o app não consegue ouvir a frase. Abra as
            configurações do aparelho e permita o microfone para o Cadê?.
          </Text>
          <BigButton
            label="Abrir configurações"
            variant="secondary"
            onPress={() => void Linking.openSettings()}
          />
        </Card>
      )}

      {Platform.OS === 'android' && (
        <Card>
          <Text style={styles.batteryTitle}>🔋 Bateria (importante)</Text>
          <Text style={styles.body}>
            Alguns aparelhos encerram o app em segundo plano. Libere o Cadê? da
            otimização de bateria para a escuta não ser interrompida.
          </Text>
          <BigButton
            label="Abrir configurações de bateria"
            variant="secondary"
            onPress={() => void openBatteryOptimizationSettings()}
          />
          <BigButton
            label={
              showBattery
                ? 'Esconder instruções por fabricante'
                : 'Ver instruções por fabricante'
            }
            variant="ghost"
            onPress={() => setShowBattery((v) => !v)}
          />
          {showBattery &&
            BATTERY_INSTRUCTIONS.map((manufacturer) => (
              <View key={manufacturer.brand} style={styles.manufacturer}>
                <Text style={styles.manufacturerBrand}>{manufacturer.brand}</Text>
                {manufacturer.steps.map((step, index) => (
                  <Text key={index} style={styles.manufacturerStep}>
                    {index + 1}. {step}
                  </Text>
                ))}
              </View>
            ))}
        </Card>
      )}

      <BigButton
        label="Continuar"
        onPress={onContinue}
        disabled={!micGranted}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 26,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  privacyCard: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  privacyText: {
    fontSize: fontSize.md,
    color: colors.primaryDark,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 26,
  },
  grantedCard: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  grantedText: {
    fontSize: fontSize.lg,
    color: colors.success,
    fontWeight: '700',
    textAlign: 'center',
  },
  deniedText: {
    fontSize: fontSize.md,
    color: colors.danger,
    lineHeight: 24,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  batteryTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  manufacturer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
  },
  manufacturerBrand: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  manufacturerStep: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
