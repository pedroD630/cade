/**
 * Detecção de saída de áudio (fone de ouvido) para o BUG-001.
 *
 * Usa `react-native-headphone-detection` (API estável do Android/iOS) via
 * `require` protegido: se o módulo nativo não estiver presente (ex.: Expo Go),
 * degrada para "desconhecido" em vez de derrubar o app.
 */

export interface HeadphoneState {
  /** Fone com fio ou Bluetooth conectado. */
  connected: boolean;
  audioJack: boolean;
  bluetooth: boolean;
  /** true quando a detecção nativa não está disponível. */
  unknown: boolean;
}

const UNKNOWN: HeadphoneState = {
  connected: false,
  audioJack: false,
  bluetooth: false,
  unknown: true,
};

export async function getHeadphoneState(): Promise<HeadphoneState> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const module = require('react-native-headphone-detection');
    const detector = module.default ?? module;
    const result = await detector.isAudioDeviceConnected();
    const audioJack = Boolean(result?.audioJack);
    const bluetooth = Boolean(result?.bluetooth);
    return { connected: audioJack || bluetooth, audioJack, bluetooth, unknown: false };
  } catch {
    return { ...UNKNOWN };
  }
}
