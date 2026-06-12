import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { BigButton } from '../components/BigButton';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { useApp } from '../context/AppContext';
import { playPreview, stopPreview } from '../services/alarm';
import {
  BUILTIN_SOUNDS,
  CUSTOM_SOUND_ID,
  deleteCustomSound,
  importCustomSound,
  resolveSoundSource,
} from '../services/sounds';
import { colors, fontSize, radius, spacing } from '../theme';

interface SoundsScreenProps {
  onBack: () => void;
}

/** Seleção de sons (P01), importação (F06/P02), preview (P03) e teste de volume (P04). */
export function SoundsScreen({ onBack }: SoundsScreenProps) {
  const { settings, updateSettings } = useApp();
  const [importing, setImporting] = useState(false);

  // Garante que nenhum preview continue tocando ao sair da tela.
  useEffect(() => {
    return () => {
      void stopPreview();
    };
  }, []);

  const handleImport = async () => {
    setImporting(true);
    try {
      const imported = await importCustomSound();
      if (imported) {
        // Substitui o som anterior, se houver.
        if (
          settings.customSoundUri &&
          settings.customSoundUri !== imported.uri
        ) {
          await deleteCustomSound(settings.customSoundUri);
        }
        await updateSettings({
          soundId: CUSTOM_SOUND_ID,
          customSoundUri: imported.uri,
          customSoundName: imported.name,
        });
      }
    } catch {
      Alert.alert(
        'Não foi possível importar',
        'Tente outro arquivo de áudio (MP3 ou M4A).'
      );
    } finally {
      setImporting(false);
    }
  };

  const handleRemoveCustom = async () => {
    await deleteCustomSound(settings.customSoundUri);
    await updateSettings({
      soundId: BUILTIN_SOUNDS[0].id,
      customSoundUri: null,
      customSoundName: null,
    });
  };

  return (
    <Screen title="Som do alarme" onBack={onBack}>
      <Card>
        <Text style={styles.sectionTitle}>Sons inclusos</Text>
        {BUILTIN_SOUNDS.map((sound) => {
          const selected = settings.soundId === sound.id;
          return (
            <View key={sound.id} style={styles.soundRow}>
              <Pressable
                style={[styles.soundSelect, selected && styles.soundSelected]}
                onPress={() => void updateSettings({ soundId: sound.id })}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Selecionar som ${sound.label}`}
              >
                <Text
                  style={[
                    styles.soundLabel,
                    selected && styles.soundLabelSelected,
                  ]}
                >
                  {selected ? '● ' : '○ '}
                  {sound.label}
                </Text>
              </Pressable>
              <Pressable
                style={styles.previewButton}
                onPress={() => void playPreview(sound.source, 3000)}
                accessibilityRole="button"
                accessibilityLabel={`Ouvir prévia de ${sound.label}`}
              >
                <Text style={styles.previewText}>▶ Ouvir</Text>
              </Pressable>
            </View>
          );
        })}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Som personalizado</Text>
        {settings.customSoundUri ? (
          <>
            <View style={styles.soundRow}>
              <Pressable
                style={[
                  styles.soundSelect,
                  settings.soundId === CUSTOM_SOUND_ID && styles.soundSelected,
                ]}
                onPress={() => void updateSettings({ soundId: CUSTOM_SOUND_ID })}
                accessibilityRole="radio"
                accessibilityState={{
                  selected: settings.soundId === CUSTOM_SOUND_ID,
                }}
                accessibilityLabel="Selecionar som personalizado"
              >
                <Text
                  style={[
                    styles.soundLabel,
                    settings.soundId === CUSTOM_SOUND_ID &&
                      styles.soundLabelSelected,
                  ]}
                  numberOfLines={1}
                >
                  {settings.soundId === CUSTOM_SOUND_ID ? '● ' : '○ '}
                  {settings.customSoundName ?? 'Som personalizado'}
                </Text>
              </Pressable>
              <Pressable
                style={styles.previewButton}
                onPress={() =>
                  void playPreview({ uri: settings.customSoundUri as string }, 3000)
                }
                accessibilityRole="button"
                accessibilityLabel="Ouvir prévia do som personalizado"
              >
                <Text style={styles.previewText}>▶ Ouvir</Text>
              </Pressable>
            </View>
            <BigButton
              label="Remover som personalizado"
              variant="ghost"
              onPress={() => void handleRemoveCustom()}
            />
          </>
        ) : (
          <Text style={styles.hint}>
            Use uma música ou gravação do seu celular como som do alarme.
          </Text>
        )}
        <BigButton
          label={importing ? 'Importando…' : '📂 Importar som do celular'}
          variant="secondary"
          disabled={importing}
          onPress={() => void handleImport()}
        />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Teste de volume</Text>
        <Text style={styles.hint}>
          Toca o som selecionado por 3 segundos no volume máximo, para conferir
          se está audível.
        </Text>
        <BigButton
          label="🔊 Testar volume"
          onPress={() => void playPreview(resolveSoundSource(settings), 3000, true)}
        />
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
  hint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  soundSelect: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  soundSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  soundLabel: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '600',
  },
  soundLabelSelected: {
    color: colors.primaryDark,
  },
  previewButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  previewText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
});
