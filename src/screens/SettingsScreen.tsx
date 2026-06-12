import React, { useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BigButton } from '../components/BigButton';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { useApp } from '../context/AppContext';
import { colors, fontSize, radius, spacing } from '../theme';
import { DEFAULT_PHRASE } from '../types';

interface SettingsScreenProps {
  onBack: () => void;
  onOpenSounds: () => void;
  onOpenPrivacy: () => void;
  onOpenBattery: () => void;
  onOpenSiri: () => void;
}

export function SettingsScreen({
  onBack,
  onOpenSounds,
  onOpenPrivacy,
  onOpenBattery,
  onOpenSiri,
}: SettingsScreenProps) {
  const { settings, updateSettings, resetAll } = useApp();
  const [phraseDraft, setPhraseDraft] = useState(settings.phrase);
  const [nameDraft, setNameDraft] = useState(settings.ownerName ?? '');

  const phraseChanged = phraseDraft.trim() !== settings.phrase;
  const phraseWordCount = phraseDraft.trim()
    ? phraseDraft.trim().split(/\s+/).length
    : 0;
  const phraseValid = phraseWordCount >= 2;

  const nameChanged = nameDraft.trim() !== (settings.ownerName ?? '');

  const confirmReset = () => {
    Alert.alert(
      'Apagar todos os dados',
      'Isso apaga a frase, os sons importados e todas as configurações. ' +
        'O app volta ao estado inicial. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar tudo',
          style: 'destructive',
          onPress: () => void resetAll(),
        },
      ]
    );
  };

  return (
    <Screen title="Configurações" onBack={onBack}>
      <Card>
        <Text style={styles.sectionTitle}>Frase de ativação</Text>
        <TextInput
          style={styles.input}
          value={phraseDraft}
          onChangeText={setPhraseDraft}
          placeholder={DEFAULT_PHRASE}
          placeholderTextColor={colors.textSecondary}
          accessibilityLabel="Frase de ativação"
        />
        {phraseChanged && !phraseValid && (
          <Text style={styles.warning}>Use pelo menos duas palavras.</Text>
        )}
        {phraseChanged && phraseValid && (
          <BigButton
            label="Salvar frase"
            onPress={() => void updateSettings({ phrase: phraseDraft.trim() })}
          />
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Som do alarme</Text>
        <BigButton label="Escolher som" variant="secondary" onPress={onOpenSounds} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Nome de quem usa</Text>
        <TextInput
          style={styles.input}
          value={nameDraft}
          onChangeText={setNameDraft}
          placeholder="Opcional — para o app cumprimentar"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="words"
          accessibilityLabel="Nome de quem usa o app"
        />
        {nameChanged && (
          <BigButton
            label="Salvar nome"
            onPress={() =>
              void updateSettings({ ownerName: nameDraft.trim() || null })
            }
          />
        )}
      </Card>

      <Card>
        <View style={styles.switchRow}>
          <View style={styles.switchTextWrapper}>
            <Text style={styles.sectionTitle}>Manter tela ligada</Text>
            <Text style={styles.hint}>
              Evita que o sistema interrompa a escuta enquanto o app está aberto.
            </Text>
          </View>
          <Switch
            value={settings.keepAwakeWhileListening}
            onValueChange={(value) =>
              void updateSettings({ keepAwakeWhileListening: value })
            }
            trackColor={{ false: colors.border, true: colors.primarySoft }}
            thumbColor={
              settings.keepAwakeWhileListening ? colors.primary : '#94A3B8'
            }
            accessibilityLabel="Manter a tela ligada enquanto ouve"
          />
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Ajuda</Text>
        {Platform.OS === 'android' && (
          <BigButton
            label="🔋 Bateria e segundo plano"
            variant="secondary"
            onPress={onOpenBattery}
          />
        )}
        {Platform.OS === 'ios' && (
          <BigButton
            label="🗣️ Atalho da Siri"
            variant="secondary"
            onPress={onOpenSiri}
          />
        )}
        <BigButton
          label="🔒 Privacidade"
          variant="secondary"
          onPress={onOpenPrivacy}
        />
      </Card>

      <Card style={styles.dangerCard}>
        <Text style={styles.sectionTitle}>Seus dados</Text>
        <Text style={styles.hint}>
          O Cadê? não coleta nenhum dado pessoal. Tudo fica somente neste
          aparelho — e você pode apagar quando quiser.
        </Text>
        <BigButton label="Apagar todos os dados" variant="danger" onPress={confirmReset} />
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
  input: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
  },
  warning: {
    fontSize: fontSize.sm,
    color: colors.danger,
    marginTop: spacing.sm,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  switchTextWrapper: {
    flex: 1,
  },
  dangerCard: {
    borderColor: colors.dangerSoft,
  },
});
