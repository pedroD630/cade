// Faixa Unicode de marcas de acentuação (combining diacritical marks),
// construída por code points para não depender da codificação do arquivo.
const COMBINING_MARKS = new RegExp(
  '[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']',
  'g'
);

/**
 * Normaliza texto para comparação tolerante: minúsculas, sem acentos,
 * sem pontuação e com espaços únicos.
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Compara a frase de ativação com as hipóteses do reconhecedor.
 *
 * Correspondência tolerante (espelha o serviço nativo): exige a palavra
 * "âncora" (a mais longa, mais distintiva) presente — para não disparar com
 * frases comuns como "cadê você" sem "celular" — e aceita perder cerca de uma
 * palavra do restante (o reconhecimento de voz erra esporadicamente).
 */
export function phraseMatches(phrase: string, candidates: string[]): boolean {
  const target = normalize(phrase);
  if (!target) return false;
  const targetTokens = target.split(' ');
  const anchor = targetTokens.reduce((a, b) => (b.length > a.length ? b : a), '');
  const threshold = Math.max(1, Math.ceil(targetTokens.length * 0.6));

  for (const candidate of candidates) {
    const normalized = normalize(candidate);
    if (!normalized) continue;
    if (normalized.includes(target)) return true;

    const words = new Set(normalized.split(' '));
    if (anchor.length >= 4 && !words.has(anchor)) continue;

    const present = targetTokens.filter((token) => words.has(token)).length;
    if (present >= threshold) return true;
  }
  return false;
}
