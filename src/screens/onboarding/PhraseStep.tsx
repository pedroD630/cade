import React, { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

import { BigButton } from '../../components/BigButton';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { colors, fontSize, radius, spacing } from '../../theme';
import { DEFAULT_PHRASE } from '../../types';

interface PhraseStepProps {
  phrase: string;
  onChangePhrase: (phrase: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

/** Tela 3 — Frase de ativação (F04), com padrão pré-preenchido. */
export function PhraseStep({
  phrase,
  onChangePhrase,
  onContinue,
  onBack,
}: PhraseStepProps) {
  const [customizing, setCustomizing] = useState(phrase !== DEFAULT_PHRASE);

  const trimmed = phrase.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const tooShort = wordCount > 0 && wordCount < 2;

  return (
    <Screen onBack={onBack} centered>
      <Text style={styles.title}>Frase de ativação</Text>
      <Text style={styles.body}>
        É a frase que faz o celular responder. Escolha algo fácil de lembrar.
      </Text>

      {customizing ? (
        <>
          <TextInput
            style={styles.input}
            value={phrase}
            onChangeText={onChangePhrase}
            placeholder={DEFAULT_PHRASE}
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="sentences"
            accessibilityLabel="Frase de ativação personalizada"
          />
          {tooShort && (
            <Text style={styles.warning}>
              Use pelo menos duas palavras — frases muito curtas disparam o
              alarme sem querer.
            </Text>
          )}
          <BigButton
            label="Usar essa frase"
            onPress={onContinue}
            disabled={!trimmed || tooShort}
          />
          <BigButton
            label="Voltar para a frase padrão"
            variant="ghost"
            onPress={() => {
              onChangePhrase(DEFAULT_PHRASE);
              setCustomizing(false);
            }}
          />
        </>
      ) : (
        <>
          <Card style={styles.phraseCard}>
            <Text style={styles.phraseText}>“{phrase}”</Text>
          </Card>
          <BigButton label="Usar essa frase" onPress={onContinue} />
          <BigButton
            label="Quero personalizar"
            variant="secondary"
            onPress={() => setCustomizing(true)}
          />
        </>
      )}
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
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: spacing.lg,
  },
  phraseCard: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  phraseText: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.primaryDark,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.lg,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  warning: {
    fontSize: fontSize.sm,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
