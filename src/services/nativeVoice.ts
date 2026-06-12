import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

/**
 * Ponte para o VoiceListenerService nativo (Android): escuta contínua em
 * background/tela apagada via Foreground Service + Vosk.
 *
 * No iOS ou quando o módulo nativo não existe (ex.: Expo Go), `hasNativeVoiceListener`
 * é false e o app usa o caminho JS (@react-native-voice/voice em foreground).
 */
interface VoiceListenerNativeModule {
  startListening(phrase: string): Promise<boolean>;
  stopListening(): Promise<boolean>;
  updatePhrase(phrase: string): Promise<boolean>;
  ringingMode(): Promise<boolean>;
  isListening(): Promise<boolean>;
}

const nativeModule = NativeModules.VoiceListenerModule as
  | VoiceListenerNativeModule
  | undefined;

export const hasNativeVoiceListener =
  Platform.OS === 'android' && nativeModule != null;

const emitter =
  nativeModule != null ? new NativeEventEmitter(NativeModules.VoiceListenerModule) : null;

export interface NativeVoiceHandlers {
  onPhraseDetected: () => void;
  /** Botão "Parar" da notificação foi tocado (serviço pede para silenciar). */
  onStopAlarm?: () => void;
  onError?: (error: string) => void;
}

export async function startNativeListening(phrase: string): Promise<void> {
  if (!nativeModule) return;
  try {
    await nativeModule.startListening(phrase);
  } catch (error) {
    console.warn('[NativeVoice] Erro ao iniciar:', error);
  }
}

export async function stopNativeListening(): Promise<void> {
  if (!nativeModule) return;
  try {
    await nativeModule.stopListening();
  } catch (error) {
    console.warn('[NativeVoice] Erro ao parar:', error);
  }
}

export async function updateNativePhrase(phrase: string): Promise<void> {
  if (!nativeModule) return;
  try {
    await nativeModule.updatePhrase(phrase);
  } catch (error) {
    console.warn('[NativeVoice] Erro ao atualizar frase:', error);
  }
}

/** Coloca o serviço em modo "tocando" (notificação com ação Parar). */
export async function enterRingingNative(): Promise<void> {
  if (!nativeModule) return;
  try {
    await nativeModule.ringingMode();
  } catch (error) {
    console.warn('[NativeVoice] Erro ao entrar em modo tocando:', error);
  }
}

/** Inscreve nos eventos do serviço. Retorna a função de cancelamento. */
export function subscribeNative(handlers: NativeVoiceHandlers): () => void {
  if (!emitter) return () => {};
  const detected = emitter.addListener('onPhraseDetected', () =>
    handlers.onPhraseDetected()
  );
  const stopAlarm = emitter.addListener('onStopAlarm', () =>
    handlers.onStopAlarm?.()
  );
  const errored = emitter.addListener('onListenerError', (error: string) =>
    handlers.onError?.(error)
  );
  return () => {
    detected.remove();
    stopAlarm.remove();
    errored.remove();
  };
}
