/**
 * Gera os 3 sons padrão do app (requisitos F05 e P01) como WAV 16-bit mono.
 * Sem dependências externas — roda com `node scripts/generate-sounds.js`.
 */
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const OUT_DIR = path.join(__dirname, '..', 'assets', 'sounds');

function writeWav(filename, samples) {
  const numSamples = samples.length;
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // tamanho do chunk fmt
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits por amostra
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }

  const fullPath = path.join(OUT_DIR, filename);
  fs.writeFileSync(fullPath, buffer);
  console.log(`gerado: ${fullPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

function silence(seconds) {
  return new Float32Array(Math.round(seconds * SAMPLE_RATE));
}

/** Tom senoidal com fade para evitar estalos. */
function tone(freq, seconds, volume = 0.85, fade = 0.015) {
  const n = Math.round(seconds * SAMPLE_RATE);
  const fadeSamples = Math.round(fade * SAMPLE_RATE);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let env = 1;
    if (i < fadeSamples) env = i / fadeSamples;
    else if (i > n - fadeSamples) env = (n - i) / fadeSamples;
    out[i] = Math.sin((2 * Math.PI * freq * i) / SAMPLE_RATE) * volume * env;
  }
  return out;
}

/** Batida de sino: parciais com decaimento exponencial. */
function bellStrike(baseFreq, seconds, volume = 0.8) {
  const n = Math.round(seconds * SAMPLE_RATE);
  const out = new Float32Array(n);
  const partials = [
    { ratio: 1.0, amp: 1.0, decay: 3.0 },
    { ratio: 2.0, amp: 0.5, decay: 4.5 },
    { ratio: 2.92, amp: 0.25, decay: 6.0 },
  ];
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    let s = 0;
    for (const p of partials) {
      s += p.amp * Math.exp(-p.decay * t) * Math.sin(2 * Math.PI * baseFreq * p.ratio * t);
    }
    out[i] = s * volume * 0.55;
  }
  return out;
}

/** Sirene: varredura contínua de frequência (com acúmulo de fase). */
function siren(fromFreq, toFreq, seconds, volume = 0.85) {
  const n = Math.round(seconds * SAMPLE_RATE);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const progress = i / n;
    // sobe e desce dentro do período
    const sweep = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
    const freq = fromFreq + (toFreq - fromFreq) * sweep;
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    let env = 1;
    const fadeSamples = Math.round(0.01 * SAMPLE_RATE);
    if (i < fadeSamples) env = i / fadeSamples;
    else if (i > n - fadeSamples) env = (n - i) / fadeSamples;
    out[i] = Math.sin(phase) * volume * env;
  }
  return out;
}

function concat(...parts) {
  const total = parts.reduce((acc, p) => acc + p.length, 0);
  const out = new Float32Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

fs.mkdirSync(OUT_DIR, { recursive: true });

// 1. Alerta clássico: bipes alternados em dois tons (estilo despertador)
writeWav(
  'alerta-classico.wav',
  concat(
    tone(880, 0.22), silence(0.08), tone(660, 0.22), silence(0.08),
    tone(880, 0.22), silence(0.08), tone(660, 0.22), silence(0.08),
    tone(880, 0.22), silence(0.08), tone(660, 0.22), silence(0.3)
  )
);

// 2. Sino suave: duas batidas de sino com decaimento natural
writeWav(
  'sino-suave.wav',
  concat(bellStrike(740, 1.1), bellStrike(880, 1.4))
);

// 3. Sirene: duas varreduras sobe-e-desce
writeWav(
  'sirene.wav',
  concat(siren(600, 1250, 1.1), siren(600, 1250, 1.1), silence(0.15))
);

console.log('Sons padrão gerados com sucesso.');
