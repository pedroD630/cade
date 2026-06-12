import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_SETTINGS, Settings } from '../types';

const SETTINGS_KEY = '@cade/settings';

/** Carrega as configurações persistidas, mesclando com os padrões (O03). */
export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Falha de escrita não pode derrubar o app; configurações seguem em memória.
  }
}

/** Apaga todos os dados locais (C03 — LGPD). */
export async function clearAllData(): Promise<void> {
  await AsyncStorage.clear();
}
