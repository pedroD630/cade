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

/** Verifica se `tokens` aparece como subsequência (em ordem) dentro de `words`. */
function containsTokensInOrder(words: string[], tokens: string[]): boolean {
  let i = 0;
  for (const word of words) {
    if (word === tokens[i]) {
      i++;
      if (i === tokens.length) return true;
    }
  }
  return false;
}

/**
 * Compara a frase de ativação com as hipóteses retornadas pelo reconhecedor.
 * Aceita correspondência por substring normalizada ou por todos os tokens
 * da frase presentes em ordem (tolera palavras extras no meio).
 */
export function phraseMatches(phrase: string, candidates: string[]): boolean {
  const target = normalize(phrase);
  if (!target) return false;
  const targetTokens = target.split(' ');

  for (const candidate of candidates) {
    const normalized = normalize(candidate);
    if (!normalized) continue;
    if (normalized.includes(target)) return true;
    if (containsTokensInOrder(normalized.split(' '), targetTokens)) return true;
  }
  return false;
}
