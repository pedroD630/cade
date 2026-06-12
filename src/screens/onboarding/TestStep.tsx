import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, Vibration } from 'react-native';

import { BigButton } from '../../components/BigButton';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { voiceListener } from '../../services/voice';
import { colors, fontSize, spacing } from '../../theme';

interface TestStepProps {
  phrase: string;
  /** Nome de quem vai usar — fluxo "configurar para outra pessoa". */
  ownerName: string | null;
  onRetry: () => void;
  onFinish: () => void;
  onBack: () => void;
}

type TestState = 'listening' | 'success' | 'unavailable';

/** Tela 4 — Teste: "Diga a frase agora para testar" com feedback visual. */
export function TestStep({ phrase, ownerName, onFinish, onBack }: TestStepProps) {
  const [state, setState] = useState<TestState>('listening');
  const [heard, setHeard] = useState<string | null>(null);

  const startTest = useCallback(() => {
    setState('listening');
    setHeard(null);
    void voiceListener.start({
      phrase,
      onMatch: () => {
        Vibration.vibrate(300);
        setState('success');
      },
      onPartial: (text) => setHeard(text),
      onUnavailable: () => setState('unavailable'),
    });
  }, [phrase]);

  useEffect(() => {
    startTest();
    return () => {
      void voiceListener.stop();
    };
  }, [startTest]);

  const instruction = ownerName
    ? `Peça para ${ownerName} dizer a frase:`
    : 'Diga a frase agora para testar:';

  return (
    <Screen onBack={onBack} centered>
      {state === 'success' ? (
        <>
          <Text style={styles.bigEmoji}>🎉</Text>
          <Text style={styles.successTitle}>Funcionou!</Text>
          <Text style={styles.body}>
            {ownerName
              ? `Tudo pronto! ${ownerName} já pode chamar o celular.`
              : 'Seu celular já sabe responder quando você chamar.'}
          </Text>
          <BigButton label="Pronto, vamos usar!" onPress={onFinish} />
          <BigButton label="Tentar de novo" variant="ghost" onPress={startTest} />
        </>
      ) : state === 'unavailable' ? (
        <>
          <Text style={styles.bigEmoji}>⚠️</Text>
          <Text style={styles.title}>Não consegui ouvir</Text>
          <Text style={styles.body}>
            O reconhecimento de voz do aparelho não respondeu. Verifique a
            permissão de microfone e tente novamente.
          </Text>
          <BigButton label="Tentar de novo" onPress={startTest} />
          <BigButton
            label="Concluir mesmo assim"
            variant="ghost"
            onPress={onFinish}
          />
        </>
      ) : (
        <>
          <Text style={styles.bigEmoji}>👂</Text>
          <Text style={styles.title}>{instruction}</Text>
          <Card style={styles.phraseCard}>
            <Text style={styles.phraseText}>“{phrase}”</Text>
          </Card>
          {heard && (
            <Text style={styles.heard} numberOfLines={2}>
              Ouvi: “{heard}”
            </Text>
          )}
          <Text style={styles.listeningHint}>Estou ouvindo…</Text>
          <BigButton
            label="Pular teste e concluir"
            variant="ghost"
            onPress={onFinish}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bigEmoji: {
    fontSize: 72,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  successTitle: {
    fontSize: fontSize.title,
    fontWeight: '900',
    color: colors.success,
    textAlign: 'center',
    marginBottom: spacing.md,
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
  heard: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.md,
  },
  listeningHint: {
    fontSize: fontSize.md,
    color: colors.success,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
});
