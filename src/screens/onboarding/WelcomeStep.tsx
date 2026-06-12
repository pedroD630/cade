import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { BigButton } from '../../components/BigButton';
import { Screen } from '../../components/Screen';
import { colors, fontSize, spacing } from '../../theme';
import { DEFAULT_PHRASE } from '../../types';

interface WelcomeStepProps {
  onConfigureForSelf: () => void;
  onConfigureForOther: () => void;
}

/** Tela 1 — Boas-vindas: explica o app em 2 frases. */
export function WelcomeStep({
  onConfigureForSelf,
  onConfigureForOther,
}: WelcomeStepProps) {
  return (
    <Screen centered>
      <Text style={styles.logo}>📱🔊</Text>
      <Text style={styles.appName}>Cadê?</Text>
      <Text style={styles.explanation}>
        Perdeu o celular em casa? Diga{' '}
        <Text style={styles.phrase}>“{DEFAULT_PHRASE}”</Text> e ele responde
        tocando bem alto — mesmo no silencioso.
      </Text>
      <BigButton label="Configurar agora" onPress={onConfigureForSelf} />
      <BigButton
        label="Configurar para outra pessoa"
        variant="secondary"
        onPress={onConfigureForOther}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  logo: {
    fontSize: 72,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: fontSize.huge,
    fontWeight: '900',
    textAlign: 'center',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  explanation: {
    fontSize: fontSize.lg,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: spacing.xl,
  },
  phrase: {
    fontWeight: '700',
    color: colors.primaryDark,
  },
});
