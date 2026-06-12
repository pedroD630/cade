/**
 * Baixa e extrai o modelo Vosk pt-BR para os assets do Android (item escolhido:
 * "script baixa + empacota no APK").
 *
 * O modelo (~50 MB) não é versionado — fica em
 * android/app/src/main/assets/model-pt/ (gitignorado) e é empacotado no APK.
 *
 * Uso: npm run fetch-vosk-model
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');
const AdmZip = require('adm-zip');

const MODEL_URL =
  'https://alphacephei.com/vosk/models/vosk-model-small-pt-0.3.zip';
const TARGET_DIR = path.join(
  __dirname,
  '..',
  'android',
  'app',
  'src',
  'main',
  'assets',
  'model-pt'
);

function download(url, destination, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) {
      reject(new Error('Muitos redirecionamentos'));
      return;
    }
    const file = fs.createWriteStream(destination);
    https
      .get(url, (response) => {
        // Segue redirecionamentos (301/302/307/308).
        if (
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          file.close();
          fs.rmSync(destination, { force: true });
          const next = new URL(response.headers.location, url).toString();
          resolve(download(next, destination, redirects + 1));
          return;
        }
        if (response.statusCode !== 200) {
          file.close();
          fs.rmSync(destination, { force: true });
          reject(new Error(`HTTP ${response.statusCode} ao baixar o modelo`));
          return;
        }

        const total = Number(response.headers['content-length']) || 0;
        let received = 0;
        let lastLogged = 0;
        response.on('data', (chunk) => {
          received += chunk.length;
          if (total > 0) {
            const pct = Math.floor((received / total) * 100);
            if (pct >= lastLogged + 10) {
              lastLogged = pct;
              process.stdout.write(`  baixando… ${pct}%\r`);
            }
          }
        });
        response.pipe(file);
        file.on('finish', () => file.close(() => resolve(destination)));
      })
      .on('error', (error) => {
        file.close();
        fs.rmSync(destination, { force: true });
        reject(error);
      });
  });
}

/** Move o conteúdo da pasta-raiz do zip (vosk-model-small-pt-0.3/) para o destino. */
function flattenInto(extractedDir, targetDir) {
  const entries = fs.readdirSync(extractedDir);
  // O zip tem uma única pasta-raiz; usamos o conteúdo dela.
  const roots = entries.filter((e) =>
    fs.statSync(path.join(extractedDir, e)).isDirectory()
  );
  const source =
    roots.length === 1 ? path.join(extractedDir, roots[0]) : extractedDir;

  fs.mkdirSync(targetDir, { recursive: true });
  for (const item of fs.readdirSync(source)) {
    fs.renameSync(path.join(source, item), path.join(targetDir, item));
  }
}

async function main() {
  // Já presente? (am/ é uma das pastas obrigatórias do modelo)
  if (fs.existsSync(path.join(TARGET_DIR, 'am'))) {
    console.log(`Modelo já presente em ${TARGET_DIR} — nada a fazer.`);
    return;
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vosk-'));
  const zipPath = path.join(tmpDir, 'model.zip');
  const extractDir = path.join(tmpDir, 'extracted');

  try {
    console.log(`Baixando ${MODEL_URL}`);
    await download(MODEL_URL, zipPath);
    console.log('\nExtraindo…');
    new AdmZip(zipPath).extractAllTo(extractDir, true);

    console.log(`Instalando em ${TARGET_DIR}`);
    flattenInto(extractDir, TARGET_DIR);

    // O Vosk StorageService.sync() exige um arquivo "uuid" no modelo para
    // versionar a cópia para o armazenamento. O modelo oficial não o inclui,
    // então criamos um — sem ele, o carregamento falha (model_load_failed).
    fs.writeFileSync(
      path.join(TARGET_DIR, 'uuid'),
      'vosk-model-small-pt-0.3-cade-v1\n'
    );

    console.log('Modelo Vosk pt-BR pronto. ✔');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error('Falha ao obter o modelo:', error.message);
  process.exit(1);
});
