import Voice, {
  SpeechErrorEvent,
  SpeechResultsEvent,
} from '@react-native-voice/voice';

import { phraseMatches } from '../utils/text';

const LOCALE = 'pt-BR';
const RESTART_DELAY_MS = 700;

export interface VoiceListenerOptions {
  phrase: string;
  /** Chamado uma única vez quando a frase é detectada. */
  onMatch: () => void;
  /** Texto parcial reconhecido — útil para feedback visual no teste. */
  onPartial?: (text: string) => void;
  /** Erro irrecuperável (ex.: serviço de voz indisponível). */
  onUnavailable?: () => void;
}

/**
 * Escuta contínua usando o reconhecimento de voz nativo do SO
 * (SpeechRecognizer no Android, SpeechRecognition no iOS).
 *
 * O reconhecedor nativo encerra sozinho após silêncio ou timeout; este
 * serviço reinicia a sessão automaticamente enquanto `running` for true.
 * Nenhum áudio é gravado ou transmitido — o processamento é 100% local/SO.
 */
class VoiceListener {
  private running = false;
  private matched = false;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;
  private options: VoiceListenerOptions | null = null;

  async isAvailable(): Promise<boolean> {
    try {
      const available = await Voice.isAvailable();
      return Boolean(available);
    } catch {
      return false;
    }
  }

  async start(options: VoiceListenerOptions): Promise<void> {
    await this.stop();
    this.options = options;
    this.running = true;
    this.matched = false;

    Voice.onSpeechResults = (e: SpeechResultsEvent) => this.handleResults(e, true);
    Voice.onSpeechPartialResults = (e: SpeechResultsEvent) =>
      this.handleResults(e, false);
    Voice.onSpeechEnd = () => this.scheduleRestart();
    Voice.onSpeechError = (e: SpeechErrorEvent) => this.handleError(e);

    await this.startRecognition();
  }

  async stop(): Promise<void> {
    this.running = false;
    this.options = null;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    try {
      await Voice.stop();
    } catch {
      // Sessão pode não estar ativa.
    }
    try {
      await Voice.destroy();
    } catch {
      // Idem.
    }
    Voice.removeAllListeners();
  }

  get isRunning(): boolean {
    return this.running;
  }

  private async startRecognition(): Promise<void> {
    if (!this.running) return;
    try {
      await Voice.start(LOCALE);
    } catch {
      this.scheduleRestart();
    }
  }

  private handleResults(event: SpeechResultsEvent, isFinal: boolean): void {
    if (!this.running || this.matched || !this.options) return;
    const candidates = event.value ?? [];

    if (this.options.onPartial && candidates.length > 0) {
      this.options.onPartial(candidates[0]);
    }

    if (phraseMatches(this.options.phrase, candidates)) {
      this.matched = true;
      const onMatch = this.options.onMatch;
      // Para a escuta antes de disparar o alarme para evitar retroalimentação.
      void this.stop().finally(onMatch);
      return;
    }

    if (isFinal) this.scheduleRestart();
  }

  private handleError(event: SpeechErrorEvent): void {
    if (!this.running) return;
    // Erros 6 (timeout de fala) e 7 (sem correspondência) são parte do ciclo
    // normal de escuta contínua no Android — apenas reinicia.
    const code = String(event.error?.code ?? '');
    if (code === '9' || code === 'permissions') {
      // Permissão insuficiente — não adianta reiniciar em loop.
      const onUnavailable = this.options?.onUnavailable;
      void this.stop().finally(() => onUnavailable?.());
      return;
    }
    this.scheduleRestart();
  }

  private scheduleRestart(): void {
    if (!this.running || this.matched) return;
    if (this.restartTimer) clearTimeout(this.restartTimer);
    this.restartTimer = setTimeout(() => {
      this.restartTimer = null;
      void this.startRecognition();
    }, RESTART_DELAY_MS);
  }
}

export const voiceListener = new VoiceListener();
