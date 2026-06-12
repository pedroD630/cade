import React from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

import { BigButton } from '../../components/BigButton';
import { Screen } from '../../components/Screen';
import { colors, fontSize, radius, spacing } from '../../theme';

interface NameStepProps {
  name: string;
  onChangeName: (name: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

/** Fluxo alternativo — "Quem vai usar o app?" (nome opcional). */
export function NameStep({ name, onChangeName, onContinue, onBack }: NameStepProps) {
  return (
    <Screen onBack={onBack} centered>
      <Text style={styles.question}>Quem vai usar o app?</Text>
      <Text style={styles.hint}>
        O nome é opcional — serve para o app cumprimentar a pessoa.
      </Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={onChangeName}
        placeholder="Ex.: Vó Maria"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="words"
        accessibilityLabel="Nome de quem vai usar o app"
      />
      <BigButton label="Continuar" onPress={onContinue} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  question: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  hint: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.lg,
    color: colors.text,
    marginBottom: spacing.lg,
  },
});
