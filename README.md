# Cadê? 📱🔊

> **"Celular, cadê você?"** → o celular responde em volume máximo, onde quer que esteja.

App mobile (React Native + Expo, TypeScript) que localiza o celular dentro de casa por voz. Implementação da fase 1 (MVP) conforme [Docs/cade-requisitos-v2.md](Docs/cade-requisitos-v2.md).

---

## Como rodar

> ⚠️ O app usa módulos nativos (`@react-native-voice/voice`, `react-native-volume-manager`), então **não funciona no Expo Go**. É preciso um *development build*.

### Android (Windows/Mac/Linux)

Pré-requisitos: [Android Studio](https://developer.android.com/studio) com SDK + JDK 17, e um aparelho físico com depuração USB (recomendado — emulador não tem microfone de verdade).

```bash
npm install
npm run fetch-vosk-model    # baixa o modelo Vosk pt-BR (~50 MB) para os assets
npx expo run:android        # compila e instala no aparelho
```

> ⚠️ **O `fetch-vosk-model` é obrigatório antes do build** — sem o modelo em `android/app/src/main/assets/model-pt/`, a escuta em background falha em runtime (evento `model_load_failed`).
>
> ⚠️ A escuta em background (`VoiceListenerService`) vive em `android/`, que é **regenerado pelo `expo prebuild`**. Se você rodar `prebuild` de novo, reaplique editando `android/` (os arquivos nativos não são config plugin, por decisão de projeto).

### iOS (somente em macOS)

Pré-requisitos: Xcode + CocoaPods.

```bash
npm install
npx expo run:ios --device
```

### Sem máquina de build (alternativa na nuvem)

```bash
npm install -g eas-cli
eas login                   # requer conta Expo (gratuita)
eas build --profile development --platform android
```

> ⚠️ Hoje o `android/` é editado à mão (não é config plugin) e está no `.gitignore`. O EAS Build roda `expo prebuild` na nuvem e **regeneraria o `android/`, perdendo o `VoiceListenerService` e os ajustes de Gradle/manifest**. Para usar EAS seria preciso versionar a pasta `android/` (e baixar o modelo via hook `eas-build-post-install`) **ou** converter as peças nativas em config plugins.

### Distribuir para outros aparelhos (sem ligar no PC de cada um)

O build de desenvolvimento depende do Metro. Para instalar em outros celulares, gere **um APK standalone de release** (embute o bundle JS + o modelo Vosk, funciona offline) **uma vez** no seu PC e compartilhe o arquivo:

```powershell
npm run fetch-vosk-model            # garante o modelo nos assets
cd android
.\gradlew.bat assembleRelease       # precisa do JAVA_HOME no JDK 21 (jbr do Android Studio)
```

Saída: `android/app/build/outputs/apk/release/app-release.apk` (~80–100 MB).

Compartilhe esse `.apk` por Google Drive, WhatsApp, e-mail etc. Em cada aparelho: permitir “instalar apps de fontes desconhecidas”, abrir o arquivo e instalar. Depois conceder microfone + notificações e **liberar a otimização de bateria** (o onboarding guia) para a escuta em segundo plano.

> O APK de release é assinado com a chave de debug (`signingConfigs.debug`). Serve para testes/sideload. Para **publicar atualizações** sem desinstalar, gere uma keystore de release própria e reutilize-a sempre (necessária também para a Play Store).

## Scripts úteis

| Comando | O que faz |
|---|---|
| `npm run typecheck` | Checagem de tipos (TypeScript estrito) |
| `npm run test:phrase` | Testa a lógica de detecção da frase de ativação |
| `npm run generate-sounds` | Regenera os 3 sons padrão (WAV sintetizados) |
| `npm run fetch-vosk-model` | Baixa o modelo Vosk pt-BR para os assets do Android |
| `npx expo-doctor` | Valida configuração do projeto (18/18 ✅) |

## Estrutura

```
App.tsx                       Raiz: roteamento simples + deep link cade://tocar
src/
  context/AppContext.tsx      Estado global: escuta, alarme, silêncio, persistência
  services/
    voice.ts                  Escuta JS (iOS / Expo Go) via @react-native-voice/voice
    nativeVoice.ts            Ponte JS → VoiceListenerService nativo (Android)
    alarm.ts                  Som em loop, volume máximo, sobre o silencioso + logs/fone
    audioRoute.ts             Detecção de fone conectado (BUG-001)
    notifications.ts          Aviso local de escuta pausada em background (iOS/JS)
    sounds.ts                 Sons embutidos + importação de som do aparelho
    storage.ts                AsyncStorage (offline-first, O01–O03)
    permissions.ts            Permissão de microfone com justificativa (C02)
    battery.ts                Instruções de bateria por fabricante (Xiaomi etc.)
android/app/src/main/java/com/cade/app/
    VoiceListenerService.kt   Foreground Service + Vosk: escuta em background/tela apagada
    VoiceListenerModule.kt    Bridge nativo → React Native (eventos de detecção)
    VoiceListenerPackage.kt   Registro do módulo nativo
  screens/
    onboarding/               4 telas: Boas-vindas → Permissões → Frase → Teste
    HomeScreen.tsx            Status, toggle, silenciar por período, testar alarme
    SettingsScreen.tsx        Frase, sons, nome, ajuda, apagar dados (C03)
    SoundsScreen.tsx          Seleção, preview 3s, importar, teste de volume
    PrivacyScreen.tsx         Política de privacidade em linguagem simples (C01/C04)
    BatteryHelpScreen.tsx     Ajuda Android (segundo plano)
    SiriHelpScreen.tsx        Ajuda iOS (atalho da Siri → cade://tocar)
  utils/text.ts               Normalização e correspondência tolerante da frase
assets/sounds/                3 sons padrão inclusos no app (F05/P01)
scripts/                      Geração de sons, teste de frase, download do modelo Vosk
```

## Cobertura dos requisitos do MVP

| Grupo | Status |
|---|---|
| F01–F08 (funcionalidade principal) | ✅ Implementados |
| S01–S04 (modo silêncio) | ✅ Implementados |
| P01–P04 (som e personalização) | ✅ Implementados |
| O01–O03 (offline) | ✅ Implementados (100% local, AsyncStorage) |
| C01–C04 (conformidade) | ✅ Implementados (política in-app, reset total, declarações) |
| Onboarding (seção 6) | ✅ 4 telas + fluxo "configurar para outra pessoa" |
| Escuta em background (Fase 4) | ✅ Android via Foreground Service + Vosk; iOS via atalho da Siri |

### Observações técnicas

- **Volume sobre o silencioso (F02):** iOS via `playsInSilentModeIOS`; Android via stream de mídia + `react-native-volume-manager` forçando volume máximo no disparo.
- **Detecção de frase:** reconhecimento nativo do SO (`pt-BR`) com reinício automático de sessão e correspondência tolerante (sem acentos, pontuação, palavras extras). Testes em `scripts/test-phrase-matching.ts`.
- **iOS:** a escuta contínua em segundo plano é restrita pela App Store; o caminho oficial é o **atalho da Siri** (tela de ajuda no app) que abre `cade://tocar`.
- **Android — escuta em background (Fase 4):** o `VoiceListenerService` é um **Foreground Service `microphone`** que roda o **Vosk** (reconhecimento 100% local, modelo `vosk-model-small-pt-0.3`) com a tela apagada, mantendo a CPU ativa via `PARTIAL_WAKE_LOCK` e exibindo notificação persistente. Ao detectar a frase, emite um evento ao JS e o `alarm.ts` dispara. O `AppContext` usa o serviço nativo no Android e o caminho JS (foreground-only) no iOS/Expo Go.
- **Foreground-only (iOS/Expo Go):** sem o serviço nativo, a escuta é pausada ao ir para background e o app emite uma **notificação local** ("Escuta pausada"). No Android com o serviço nativo, isso não se aplica (o FGS tem a própria notificação).
- **Limitação conhecida:** com o app em background e a frase detectada, o alarme toca, mas **para silenciá-lo é preciso abrir o app** (a `RingingOverlay` não aparece sobre outras telas). Uma ação de "parar" na notificação durante o toque é um próximo passo.
- **MIUI/HyperOS (Xiaomi):** o serviço sobrevive ao background, mas o usuário **precisa conceder a isenção de otimização de bateria** (o onboarding e a tela de ajuda guiam isso), senão o MIUI pode throttlear a CPU mesmo com o wake lock.
- **Fone de ouvido (BUG-001):** ao disparar o alarme, se houver fone (cabo/Bluetooth) conectado, o app **não estoura o volume nos ouvidos** — reduz o volume de reprodução e **reforça a vibração**. Detecção via `react-native-headphone-detection` com *fallback* gracioso se o módulo nativo estiver ausente.
- **Diagnóstico do alarme (BUG-005):** `alarm.ts` emite **logs estruturados** com prefixo `[ALARM]` (JSON com timestamp e estado: modo de áudio, volume, fone, criação/reprodução do som). Capture com `adb logcat -s ReactNativeJS | findstr ALARM`.

## O que ainda depende de configuração do usuário

Veja a seção final do processo de implementação — em resumo: build nativo em aparelho físico, conta Expo/EAS (opcional), contas das lojas para publicação, configuração de bateria no aparelho (Android) e criação do atalho da Siri (iOS).
