import { AVPlaybackSource } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

import { Settings } from '../types';

export interface SoundOption {
  id: string;
  label: string;
  source: AVPlaybackSource;
}

/** Sons embutidos no app — nenhum download necessário (F05, P01, O02). */
export const BUILTIN_SOUNDS: SoundOption[] = [
  {
    id: 'builtin:alerta',
    label: 'Alerta clássico',
    source: require('../../assets/sounds/alerta-classico.wav'),
  },
  {
    id: 'builtin:sino',
    label: 'Sino suave',
    source: require('../../assets/sounds/sino-suave.wav'),
  },
  {
    id: 'builtin:sirene',
    label: 'Sirene',
    source: require('../../assets/sounds/sirene.wav'),
  },
];

export const CUSTOM_SOUND_ID = 'custom';

/** Resolve o som configurado para uma fonte tocável, com fallback seguro. */
export function resolveSoundSource(settings: Settings): AVPlaybackSource {
  if (settings.soundId === CUSTOM_SOUND_ID && settings.customSoundUri) {
    return { uri: settings.customSoundUri };
  }
  const builtin = BUILTIN_SOUNDS.find((s) => s.id === settings.soundId);
  return (builtin ?? BUILTIN_SOUNDS[0]).source;
}

export interface ImportedSound {
  uri: string;
  name: string;
}

/**
 * Importa um arquivo de áudio do dispositivo e copia para o diretório do app,
 * garantindo que continue disponível offline (F06, P02, O02).
 */
export async function importCustomSound(): Promise<ImportedSound | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['audio/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  const extensionMatch = /\.[a-zA-Z0-9]+$/.exec(asset.name ?? '');
  const extension = extensionMatch ? extensionMatch[0] : '.mp3';
  const destination = `${FileSystem.documentDirectory}som-personalizado${extension}`;

  // Remove som anterior, se houver, antes de copiar o novo.
  await FileSystem.deleteAsync(destination, { idempotent: true });
  await FileSystem.copyAsync({ from: asset.uri, to: destination });

  return { uri: destination, name: asset.name ?? 'Som personalizado' };
}

/** Remove o som personalizado do armazenamento do app. */
export async function deleteCustomSound(uri: string | null): Promise<void> {
  if (!uri) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Arquivo pode já não existir.
  }
}
