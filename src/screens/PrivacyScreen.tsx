import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { colors, fontSize, spacing } from '../theme';

interface PrivacyScreenProps {
  onBack: () => void;
}

/**
 * Política de privacidade em linguagem simples (C01), com a declaração de que
 * nenhum áudio é gravado ou enviado (C04) e conformidade com a LGPD.
 */
export function PrivacyScreen({ onBack }: PrivacyScreenProps) {
  return (
    <Screen title="Privacidade" onBack={onBack}>
      <Card style={styles.highlightCard}>
        <Text style={styles.highlight}>
          🔒 Nenhum áudio é gravado, armazenado ou enviado para fora do seu
          celular. Nunca.
        </Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Como o app ouve?</Text>
        <Text style={styles.body}>
          O Cadê? usa o reconhecimento de voz que já existe no seu celular
          (Android ou iPhone). A frase que você diz é processada pelo próprio
          aparelho, na hora, e descartada em seguida.
        </Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Quais dados o app guarda?</Text>
        <Text style={styles.body}>
          Somente as suas preferências: a frase de ativação, o som escolhido e
          o nome opcional de quem usa. Tudo fica salvo apenas neste aparelho —
          não existe conta, login, servidor nem sincronização.
        </Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Internet</Text>
        <Text style={styles.body}>
          O Cadê? funciona sem internet. O app não envia nenhuma informação
          sua para a nossa equipe ou para terceiros.
        </Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Seus direitos (LGPD)</Text>
        <Text style={styles.body}>
          Como nenhum dado pessoal é coletado, não há nada nosso para pedir,
          corrigir ou portar. Para apagar as preferências guardadas no
          aparelho, use “Apagar todos os dados” em Configurações — o app volta
          ao estado de fábrica imediatamente.
        </Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Permissão de microfone</Text>
        <Text style={styles.body}>
          A permissão de microfone é usada exclusivamente para reconhecer a
          frase de ativação. Você pode revogá-la a qualquer momento nas
          configurações do aparelho — o app simplesmente deixa de ouvir.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  highlightCard: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  highlight: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.primaryDark,
    textAlign: 'center',
    lineHeight: 30,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 26,
  },
});
