export interface Settings {
  /** Onboarding concluído — controla qual fluxo o app abre. */
  onboardingDone: boolean;
  /** Frase de ativação (F04). */
  phrase: string;
  /** Nome de quem usa o app (fluxo "configurar para outra pessoa"). */
  ownerName: string | null;
  /** Som selecionado: id de som embutido ou 'custom'. */
  soundId: string;
  /** URI local do som importado pelo usuário (F06/O02). */
  customSoundUri: string | null;
  /** Nome de exibição do som importado. */
  customSoundName: string | null;
  /** Escuta ligada/desligada (F07). */
  listeningEnabled: boolean;
  /** Timestamp (ms) até quando a escuta está silenciada (S02/S03). */
  silencedUntil: number | null;
  /** Manter a tela ligada enquanto a escuta está ativa. */
  keepAwakeWhileListening: boolean;
}

export const DEFAULT_PHRASE = 'Celular, cadê você?';

export const DEFAULT_SETTINGS: Settings = {
  onboardingDone: false,
  phrase: DEFAULT_PHRASE,
  ownerName: null,
  soundId: 'builtin:alerta',
  customSoundUri: null,
  customSoundName: null,
  listeningEnabled: true,
  silencedUntil: null,
  keepAwakeWhileListening: true,
};

/** Estado de alto nível mostrado ao usuário (F08). */
export type ListeningStatus =
  | 'off' // escuta desligada pelo usuário
  | 'listening' // ouvindo ativamente
  | 'silenced' // silenciada por período
  | 'ringing' // alarme tocando
  | 'no-permission' // sem permissão de microfone
  | 'unavailable'; // reconhecimento de voz indisponível no aparelho
