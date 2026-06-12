/**
 * Teste rápido da lógica de detecção de frase (sem framework).
 * Rodar com: node scripts/test-phrase-matching.ts
 */
import { normalize, phraseMatches } from '../src/utils/text.ts';

const PHRASE = 'Celular, cadê você?';

const cases: Array<{ candidates: string[]; expected: boolean; label: string }> = [
  { candidates: ['celular cadê você'], expected: true, label: 'transcrição exata' },
  { candidates: ['Celular cade voce'], expected: true, label: 'sem acentos' },
  { candidates: ['ei celular cadê você por favor'], expected: true, label: 'palavras extras nas pontas' },
  { candidates: ['celular meu cadê você'], expected: true, label: 'palavra extra no meio (tokens em ordem)' },
  { candidates: ['CELULAR, CADÊ VOCÊ?!'], expected: true, label: 'maiúsculas e pontuação' },
  { candidates: ['errado', 'celular cadê você'], expected: true, label: 'segunda hipótese do reconhecedor' },
  { candidates: ['cadê você celular'], expected: false, label: 'ordem invertida' },
  { candidates: ['celular'], expected: false, label: 'frase incompleta' },
  { candidates: ['bom dia, tudo bem?'], expected: false, label: 'fala não relacionada' },
  { candidates: [], expected: false, label: 'sem hipóteses' },
];

let failures = 0;
for (const testCase of cases) {
  const result = phraseMatches(PHRASE, testCase.candidates);
  const ok = result === testCase.expected;
  if (!ok) failures++;
  console.log(`${ok ? 'OK  ' : 'FALHOU'} ${testCase.label} -> ${result}`);
}

console.log(`\nnormalize('Celular, cadê você?') = '${normalize(PHRASE)}'`);

if (failures > 0) {
  console.error(`\n${failures} caso(s) falharam`);
  process.exit(1);
}
console.log('\nTodos os casos passaram.');
