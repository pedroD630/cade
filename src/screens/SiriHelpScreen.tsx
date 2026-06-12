import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { colors, fontSize, spacing } from '../theme';

interface SiriHelpScreenProps {
  onBack: () => void;
}

/**
 * No iOS, a alternativa ao microfone contínuo é um atalho da Siri que abre
 * o app pela URL cade://tocar e dispara o alarme (nota técnica da seção 4).
 */
export function SiriHelpScreen({ onBack }: SiriHelpScreenProps) {
  return (
    <Screen title="Atalho da Siri" onBack={onBack}>
      <Card>
        <Text style={styles.body}>
          No iPhone, a forma mais confiável de chamar o celular é pela Siri.
          Você cria um atalho uma única vez e depois basta dizer:
        </Text>
        <Text style={styles.phrase}>“E aí Siri, cadê meu celular?”</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Como criar o atalho</Text>
        <Text style={styles.step}>1. Abra o app Atalhos do iPhone</Text>
        <Text style={styles.step}>2. Toque em “+” para criar um novo atalho</Text>
        <Text style={styles.step}>
          3. Adicione a ação “Abrir URL” e digite: cade://tocar
        </Text>
        <Text style={styles.step}>
          4. Dê um nome falado ao atalho, como “Cadê meu celular”
        </Text>
        <Text style={styles.step}>
          5. Pronto! Diga “E aí Siri, cadê meu celular” para o aparelho tocar
          o alarme
        </Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Por que assim?</Text>
        <Text style={styles.body}>
          A Siri já fica ouvindo o tempo todo com baixo consumo de bateria e
          funciona até com o app fechado. O atalho abre o Cadê? e o alarme
          toca na hora, em volume máximo.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  phrase: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.primaryDark,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  step: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 28,
  },
});
