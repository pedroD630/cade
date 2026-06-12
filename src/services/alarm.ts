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

// Tokens de geração: cada start/stop incrementa o token. Se um `createAsync`
// (que leva ~0,5–1,5 s) resolve depois que um stop/novo start aconteceu, o som
// criado é considerado obsoleto e descarregado na hora — evita o som que "toca
// depois e não para" (corrida) e a fuga de foco de áudio que silencia o próximo.
let alarmGeneration = 0;
let previewGeneration = 0;

type CreateResult = Awaited<ReturnType<typeof Audio.Sound.createAsync>>;

/** Volume de reprodução seguro quando há fone conectado (BUG-001). */
const HEADPHONE_SAFE_VOLUME = 0.5;

/** Padrão de vibração padrão (sem fone): vibra 600ms, pausa 400ms. */
const VIBRATION_NORMAL = [0, 600, 400];
/** Padrão reforçado (com fone): mais denso, para compensar o volume reduzido. */
const VIBRATION_REINFORCED = [0, 500, 200, 500, 200, 800, 400];

function logAlarm(event: string, data?: Record<string, unknown>): void {
  const payload = { tag: 'ALARM', ts: new Date().toISOString(), event, ...data };
  console.log('[ALARM]', JSON.stringify(payload));
}

/** Para e descarrega um som, sempre liberando o recurso/foco de áudio. */
async function unloadSound(sound: Audio.Sound): Promise<void> {
  try {
    await sound.stopAsync();
  } catch {
    // Som pode já ter sido parado/descarregado.
  }
  try {
    await sound.unloadAsync();
  } catch {
    // Idem.
  }
}

/**
 * Configura o modo de áudio para tocar sobre o modo silencioso (F02):
 * - iOS: `playsInSilentModeIOS` ignora o switch de silêncio.
 * - Android: o stream de mídia não é afetado pelo modo silencioso do toque.
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

/** Força o volume do sistema ao máximo (F01). Fire-and-forget — loga o resultado. */
async function forceMaxVolume(): Promise<void> {
  try {
    const { VolumeManager } = require('react-native-volume-manager');
    await VolumeManager.setVolume(1.0, { showUI: false });
    logAlarm('volume_forced', { level: 1.0 });
  } catch (error) {
    logAlarm('volume_force_failed', { message: String(error) });
  }
}

/** Toca o som do alarme em loop até `stopAlarm` ser chamado (F01, F03). */
export async function startAlarm(source: AVPlaybackSource): Promise<void> {
  logAlarm('start_requested');
  const myGen = ++alarmGeneration;

  // Descarrega o som atual (se houver) e qualquer preview.
  const previous = currentSound;
  currentSound = null;
  if (previous) await unloadSound(previous);
  await stopPreview();

  // headphone state e audio mode são independentes — rodam em paralelo.
  const headphonesPromise = getHeadphoneState();
  const audioModePromise = configureAudioMode();

  const headphones = await headphonesPromise;
  logAlarm('headphone_state', { ...headphones });
  try {
    await audioModePromise;
    logAlarm('audio_mode_applied');
  } catch (error) {
    logAlarm('audio_mode_failed', { message: String(error) });
  }

  // Vibração começa primeiro: fallback de localização caso o áudio falhe/atrase.
  const pattern = headphones.connected ? VIBRATION_REINFORCED : VIBRATION_NORMAL;
  Vibration.vibrate(pattern, true);
  logAlarm('vibration_started', { reinforced: headphones.connected });

  // Volume em paralelo com o carregamento do som (reduz o delay de saída).
  if (headphones.connected) logAlarm('skip_force_volume_headphones');
  else void forceMaxVolume();

  const playbackVolume = headphones.connected ? HEADPHONE_SAFE_VOLUME : 1.0;
  let created: CreateResult | null = null;
  try {
    created = await Audio.Sound.createAsync(source, {
      isLooping: true,
      volume: playbackVolume,
      shouldPlay: true,
    });
  } catch (error) {
    logAlarm('sound_create_failed', { message: String(error) });
    return;
  }

  // Se um stop (ou novo start) ocorreu durante o createAsync, descarta este som
  // imediatamente — senão ele tocaria "fora de hora" e sem como parar.
  if (myGen !== alarmGeneration) {
    logAlarm('sound_discarded_stale');
    await unloadSound(created.sound);
    return;
  }

  currentSound = created.sound;
  logAlarm('sound_created', {
    isLoaded: created.status.isLoaded,
    isPlaying: created.status.isLoaded ? created.status.isPlaying : false,
    volume: playbackVolume,
  });
}

/** Para o alarme e a vibração (S01). */
export async function stopAlarm(): Promise<void> {
  alarmGeneration++; // invalida qualquer start em voo (descarta o som que vier)
  Vibration.cancel();
  const sound = currentSound;
  currentSound = null;
  if (!sound) return;
  logAlarm('stop_requested');
  await unloadSound(sound);
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
  const myGen = ++previewGeneration;

  const previous = previewSound;
  previewSound = null;
  if (previewTimer) {
    clearTimeout(previewTimer);
    previewTimer = null;
  }
  if (previous) await unloadSound(previous);

  await configureAudioMode();
  if (maxVolume) await forceMaxVolume();

  let created: CreateResult | null = null;
  try {
    created = await Audio.Sound.createAsync(source, {
      isLooping: true,
      volume: 1.0,
      shouldPlay: true,
    });
  } catch {
    return;
  }

  if (myGen !== previewGeneration) {
    await unloadSound(created.sound);
    return;
  }

  previewSound = created.sound;
  previewTimer = setTimeout(() => {
    void stopPreview();
  }, durationMs);
}

export async function stopPreview(): Promise<void> {
  previewGeneration++; // invalida qualquer preview em voo
  if (previewTimer) {
    clearTimeout(previewTimer);
    previewTimer = null;
  }
  const sound = previewSound;
  previewSound = null;
  if (!sound) return;
  await unloadSound(sound);
}
