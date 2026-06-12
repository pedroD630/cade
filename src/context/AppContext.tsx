import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';

import { startAlarm, stopAlarm } from '../services/alarm';
import {
  enterRingingNative,
  hasNativeVoiceListener,
  startNativeListening,
  stopNativeListening,
  subscribeNative,
} from '../services/nativeVoice';
import {
  dismissListeningPausedNotification,
  ensureNotificationSetup,
  showListeningPausedNotification,
} from '../services/notifications';
import { hasMicPermission } from '../services/permissions';
import { deleteCustomSound, resolveSoundSource } from '../services/sounds';
import { clearAllData, loadSettings, saveSettings } from '../services/storage';
import { voiceListener } from '../services/voice';
import { DEFAULT_SETTINGS, ListeningStatus, Settings } from '../types';

interface AppContextValue {
  loaded: boolean;
  settings: Settings;
  status: ListeningStatus;
  silenceRemainingMs: number | null;
  micGranted: boolean | null;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  triggerAlarm: () => Promise<void>;
  stopRinging: () => Promise<void>;
  silenceFor: (ms: number) => Promise<void>;
  cancelSilence: () => Promise<void>;
  resetAll: () => Promise<void>;
  refreshMicPermission: () => Promise<boolean>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ringing, setRinging] = useState(false);
  const [micGranted, setMicGranted] = useState<boolean | null>(null);
  const [voiceUnavailable, setVoiceUnavailable] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  // App em primeiro plano? A escuta é foreground-only (limitação do BUG-002):
  // ao ir para background, paramos o reconhecedor e avisamos o usuário.
  const [appActive, setAppActive] = useState(true);

  // Refs para callbacks assíncronos lerem sempre o estado mais recente.
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const ringingRef = useRef(ringing);
  ringingRef.current = ringing;
  // Estava ouvindo no momento em que o app foi para background? (decide o aviso)
  const wasListeningRef = useRef(false);

  // ---- Carga inicial (O03) ----
  useEffect(() => {
    void (async () => {
      const [stored, mic] = await Promise.all([loadSettings(), hasMicPermission()]);
      setSettings(stored);
      setMicGranted(mic);
      setLoaded(true);
    })();
  }, []);

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettings(next);
    await saveSettings(next);
  }, []);

  // ---- Silêncio temporizado (S02/S03/S04) ----
  const silenced =
    settings.silencedUntil !== null && settings.silencedUntil > now;
  const silenceRemainingMs = silenced
    ? (settings.silencedUntil as number) - now
    : null;

  useEffect(() => {
    if (settings.silencedUntil === null) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [settings.silencedUntil]);

  // Quando o período de silêncio expira, retoma automaticamente (S03).
  useEffect(() => {
    if (settings.silencedUntil !== null && settings.silencedUntil <= now) {
      void updateSettings({ silencedUntil: null });
    }
  }, [settings.silencedUntil, now, updateSettings]);

  // ---- Status visível ao usuário (F08) ----
  const status: ListeningStatus = ringing
    ? 'ringing'
    : !settings.listeningEnabled
      ? 'off'
      : silenced
        ? 'silenced'
        : micGranted === false
          ? 'no-permission'
          : voiceUnavailable
            ? 'unavailable'
            : 'listening';

  // `status === 'listening'` reflete a intenção de ouvir (ignora o background);
  // usado para decidir se avisamos ao perder o foreground.
  wasListeningRef.current = status === 'listening';

  // ---- Alarme ----
  const triggerAlarm = useCallback(async () => {
    if (ringingRef.current) return;
    ringingRef.current = true;
    setRinging(true);
    try {
      await startAlarm(resolveSoundSource(settingsRef.current));
    } catch {
      // Mesmo que o áudio falhe, mantém a tela de "encontrado" com vibração.
    }
  }, []);

  const stopRinging = useCallback(async () => {
    await stopAlarm();
    ringingRef.current = false;
    setRinging(false);
  }, []);

  // ---- Escuta contínua (F01/F07) ----
  // Android com o VoiceListenerService nativo ouve em background/tela apagada
  // (Foreground Service), então NÃO depende do foreground (appActive). No iOS /
  // Expo Go, o caminho JS é foreground-only e paramos ao ir para background.
  const wantsListening = loaded && settings.onboardingDone && status === 'listening';
  const shouldListen = hasNativeVoiceListener
    ? wantsListening
    : wantsListening && appActive;

  // Caminho nativo (Android): inscrição nos eventos do serviço (uma vez).
  useEffect(() => {
    if (!hasNativeVoiceListener) return undefined;
    return subscribeNative({
      onPhraseDetected: () => {
        void triggerAlarm();
      },
      // Botão "Parar" da notificação → silencia sem abrir o app.
      onStopAlarm: () => {
        void stopRinging();
      },
      onError: (error) => {
        // Loga o motivo real (visível no Metro) para diagnóstico.
        console.warn('[NativeVoice] erro do serviço:', error);
        if (error.startsWith('model_load_failed')) setVoiceUnavailable(true);
      },
    });
  }, [triggerAlarm, stopRinging]);

  // Caminho nativo (Android): controla o serviço conforme o estado.
  useEffect(() => {
    if (!hasNativeVoiceListener) return;
    if (status === 'ringing') {
      // Mantém o serviço vivo durante o alarme e mostra a ação Parar.
      void enterRingingNative();
    } else if (shouldListen) {
      void startNativeListening(settingsRef.current.phrase);
    } else {
      void stopNativeListening();
    }
  }, [status, shouldListen, settings.phrase]);

  // Caminho JS (iOS / Expo Go): @react-native-voice/voice em foreground.
  useEffect(() => {
    if (hasNativeVoiceListener) return;
    if (!shouldListen) {
      void voiceListener.stop();
      return;
    }

    let cancelled = false;
    void (async () => {
      const available = await voiceListener.isAvailable();
      if (cancelled) return;
      if (!available) {
        setVoiceUnavailable(true);
        return;
      }
      await voiceListener.start({
        phrase: settingsRef.current.phrase,
        onMatch: () => {
          void triggerAlarm();
        },
        onUnavailable: () => setVoiceUnavailable(true),
      });
    })();

    return () => {
      cancelled = true;
      void voiceListener.stop();
    };
  }, [shouldListen, settings.phrase, triggerAlarm]);

  // ---- Mantém a tela ligada enquanto ouve (ajuda no Android) ----
  useEffect(() => {
    const active =
      settings.keepAwakeWhileListening && (shouldListen || ringing);
    if (active) {
      void activateKeepAwakeAsync('cade-listening');
      return () => {
        void deactivateKeepAwake('cade-listening');
      };
    }
    return undefined;
  }, [settings.keepAwakeWhileListening, shouldListen, ringing]);

  // ---- Pausa/retoma a escuta conforme o foreground (Fix 1) ----
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        // Voltou ao primeiro plano: retoma escuta, revalida permissão/silêncio
        // e remove o aviso de pausa.
        setAppActive(true);
        setNow(Date.now());
        void hasMicPermission().then(setMicGranted);
        void dismissListeningPausedNotification();
      } else if (state === 'background') {
        // 'inactive' (transitório no iOS) é ignorado para não piscar a escuta.
        setAppActive(false);
        // No caminho nativo a escuta continua em background (o FGS tem a própria
        // notificação), então o aviso de pausa só vale para o caminho JS.
        if (!hasNativeVoiceListener && wasListeningRef.current) {
          void showListeningPausedNotification(settingsRef.current.ownerName);
        }
      }
    });
    return () => subscription.remove();
  }, []);

  // Garante canal + permissão de notificação na primeira vez que a escuta fica
  // ativa em foreground — momento natural para o pedido.
  const notifSetupRef = useRef(false);
  useEffect(() => {
    if (shouldListen && !notifSetupRef.current) {
      notifSetupRef.current = true;
      void ensureNotificationSetup();
    }
  }, [shouldListen]);

  const silenceFor = useCallback(
    async (ms: number) => {
      await updateSettings({ silencedUntil: Date.now() + ms });
    },
    [updateSettings]
  );

  const cancelSilence = useCallback(async () => {
    await updateSettings({ silencedUntil: null });
  }, [updateSettings]);

  const refreshMicPermission = useCallback(async () => {
    const granted = await hasMicPermission();
    setMicGranted(granted);
    return granted;
  }, []);

  // ---- Exclusão total de dados (C03) ----
  const resetAll = useCallback(async () => {
    await voiceListener.stop();
    await stopAlarm();
    setRinging(false);
    ringingRef.current = false;
    await deleteCustomSound(settingsRef.current.customSoundUri);
    await clearAllData();
    settingsRef.current = { ...DEFAULT_SETTINGS };
    setSettings({ ...DEFAULT_SETTINGS });
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      loaded,
      settings,
      status,
      silenceRemainingMs,
      micGranted,
      updateSettings,
      triggerAlarm,
      stopRinging,
      silenceFor,
      cancelSilence,
      resetAll,
      refreshMicPermission,
    }),
    [
      loaded,
      settings,
      status,
      silenceRemainingMs,
      micGranted,
      updateSettings,
      triggerAlarm,
      stopRinging,
      silenceFor,
      cancelSilence,
      resetAll,
      refreshMicPermission,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser usado dentro de <AppProvider>');
  }
  return context;
}
