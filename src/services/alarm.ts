import {
  Audio,
  AVPlaybackSource,
  InterruptionModeAndroid,
  InterruptionModeIOS,
} from 'expo-av';
import { Vibration } from 'react-native';

import { getHeadphoneState } from './audioRoute';

let currentSound: Audio.Sound | null = null;
let previewSound: Audio.Sound | null = null;
let previewTimer: ReturnType<typeof setTimeout> | null = null;

/** Volume de reprodução seguro quando há fone conectado (BUG-001). */
const HEADPHONE_SAFE_VOLUME = 0.5;

/** Padrão de vibração padrão (sem fone): vibra 600ms, pausa 400ms. */
const VIBRATION_NORMAL = [0, 600, 400];
/** Padrão reforçado (com fone): mais denso, para compensar o volume reduzido. */
const VIBRATION_REINFORCED = [0, 500, 200, 500, 200, 800, 400];

/**
 * Log estruturado do alarme para diagnóstico do BUG-005 (áudio bloqueia após
 * uso prolongado). Cada linha é um JSON com timestamp e o evento, capturável
 * via `adb logcat` ou no console do Metro.
 */
function logAlarm(event: string, data?: Record<string, unknown>): void {
  const payload = { tag: 'ALARM', ts: new Date().toISOString(), event, ...data };
  console.log('[ALARM]', JSON.stringify(payload));
}

/**
 * Configura o modo de áudio para tocar sobre o modo silencioso (F02):
 * - iOS: `playsInSilentModeIOS` ignora o switch de silêncio.
 * - Android: o stream de mídia não é afetado pelo modo silencioso do toque;
 *   o volume é forçado ao máximo via react-native-volume-manager.
 */
async function configureAudioMode(): Promise<void> {
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
    shouldDuckAndroid: false,
    playThroughEarpieceAndroid: false,
  });
}

/**
 * Força o volume do sistema ao máximo (F01). O módulo nativo só existe em
 * builds de desenvolvimento/produção; em ambientes sem ele, o app segue
 * tocando no volume atual do aparelho.
 */
async function forceMaxVolume(): Promise<void> {
  try {
    const { VolumeManager } = require('react-native-volume-manager');
    await VolumeManager.setVolume(1.0, { showUI: false });
    logAlarm('volume_forced', { level: 1.0 });
  } catch (error) {
    // Módulo indisponível (ex.: Expo Go) — segue sem forçar volume.
    logAlarm('volume_force_failed', { message: String(error) });
  }
}

/** Toca o som do alarme em loop até `stopAlarm` ser chamado (F01, F03). */
export async function startAlarm(source: AVPlaybackSource): Promise<void> {
  logAlarm('start_requested');
  await stopAlarm();
  await stopPreview();

  // BUG-001: com fone conectado, não estoura o volume nos ouvidos — reduz o
  // volume de reprodução e reforça a vibração, em vez de forçar alto-falante.
  const headphones = await getHeadphoneState();
  logAlarm('headphone_state', { ...headphones });

  try {
    await configureAudioMode();
    logAlarm('audio_mode_applied');
  } catch (error) {
    logAlarm('audio_mode_failed', { message: String(error) });
  }

  // Vibração começa primeiro: é o fallback de localização caso a reprodução
  // de áudio falhe (cenário central do BUG-005).
  const pattern = headphones.connected ? VIBRATION_REINFORCED : VIBRATION_NORMAL;
  Vibration.vibrate(pattern, true);
  logAlarm('vibration_started', { reinforced: headphones.connected });

  if (headphones.connected) {
    logAlarm('skip_force_volume_headphones');
  } else {
    await forceMaxVolume();
  }

  const playbackVolume = headphones.connected ? HEADPHONE_SAFE_VOLUME : 1.0;
  try {
    const { sound, status } = await Audio.Sound.createAsync(source, {
      isLooping: true,
      volume: playbackVolume,
      shouldPlay: true,
    });
    currentSound = sound;
    logAlarm('sound_created', {
      isLoaded: status.isLoaded,
      isPlaying: status.isLoaded ? status.isPlaying : false,
      volume: playbackVolume,
    });
  } catch (error) {
    // Não relança: a vibração já está tocando como fallback. O log registra
    // a falha exata para o diagnóstico do BUG-005.
    logAlarm('sound_create_failed', { message: String(error) });
  }
}

/** Para o alarme e a vibração (S01). */
export async function stopAlarm(): Promise<void> {
  Vibration.cancel();
  if (!currentSound) return;
  logAlarm('stop_requested');
  const sound = currentSound;
  currentSound = null;
  try {
    await sound.stopAsync();
  } catch {
    // Som pode já ter sido descarregado.
  }
  try {
    await sound.unloadAsync();
  } catch {
    // Idem.
  }
  logAlarm('stopped');
}

/**
 * Preview curto do som (P03/P04). `maxVolume` define se o teste deve forçar
 * o volume do sistema — usado no "testar volume" (P04).
 */
export async function playPreview(
  source: AVPlaybackSource,
  durationMs = 3000,
  maxVolume = false
): Promise<void> {
  await stopPreview();
  await configureAudioMode();
  if (maxVolume) await forceMaxVolume();

  const { sound } = await Audio.Sound.createAsync(source, {
    isLooping: true,
    volume: 1.0,
    shouldPlay: true,
  });
  previewSound = sound;
  previewTimer = setTimeout(() => {
    void stopPreview();
  }, durationMs);
}

export async function stopPreview(): Promise<void> {
  if (previewTimer) {
    clearTimeout(previewTimer);
    previewTimer = null;
  }
  if (!previewSound) return;
  const sound = previewSound;
  previewSound = null;
  try {
    await sound.stopAsync();
  } catch {
    // Som pode já ter sido descarregado.
  }
  try {
    await sound.unloadAsync();
  } catch {
    // Idem.
  }
}
