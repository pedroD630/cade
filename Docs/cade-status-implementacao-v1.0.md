# Cadê? — Status de Implementação (v1.0 — Fase 1 / MVP)

> **"Celular, cadê você?"** → o celular responde em volume máximo, onde quer que esteja.

**Versão:** 1.0 (MVP da Fase 1, com escuta em background antecipada da Fase 4)
**Data:** 12 de junho de 2026
**Plataforma alvo:** Android (testado em Xiaomi Redmi Note 13). iOS via atalho da Siri.
**Documento de referência:** [cade-requisitos-v2.md](cade-requisitos-v2.md)

---

## 1. Resumo

Aplicativo mobile (React Native + Expo SDK 53, TypeScript) que localiza o celular dentro de casa pela voz. Ao dizer a frase de ativação (padrão *"Celular, cadê você?"*), o aparelho toca um alarme em volume máximo, ignorando o modo silencioso, até ser silenciado.

O MVP da Fase 1 está **completo**. Além disso, a **escuta em segundo plano com a tela apagada** (originalmente prevista para a Fase 4) foi **antecipada e implementada** no Android via Foreground Service + Vosk, pois o teste de campo mostrou ser indispensável.

Estado geral: **primeira versão funcional**, validada em aparelho real, distribuível por APK.

---

## 2. Stack tecnológica (como construído)

| Camada | Tecnologia | Observação |
|--------|-----------|-----------|
| Framework | React Native 0.79 + Expo SDK 53 (prebuild) | New Architecture desligada |
| Linguagem | TypeScript (estrito) | `tsc --noEmit` limpo |
| Escuta (Android, background) | **Vosk** (`vosk-android`), modelo `vosk-model-small-pt-0.3` | 100% local, offline |
| Escuta (iOS / Expo Go) | `@react-native-voice/voice` | foreground; iOS usa atalho da Siri |
| Reprodução de som | `expo-av` | volume máximo sobre o silencioso |
| Volume do sistema | `react-native-volume-manager` | força o volume no disparo |
| Detecção de fone | `react-native-headphone-detection` (patched) | harm-reduction (BUG-001) |
| Notificações locais | `expo-notifications` | aviso de pausa (iOS/JS) |
| Armazenamento | `AsyncStorage` + arquivos locais | offline-first, sem backend |
| Backend | Nenhum | custo R$ 0/mês |

---

## 3. Cobertura dos requisitos do MVP

### 3.1 Funcionalidade principal

| ID | Requisito | Status |
|----|-----------|--------|
| F01 | Ao detectar a frase, tocar som em volume máximo | ✅ |
| F02 | Ignorar modo silencioso / não perturbe | ✅ |
| F03 | Continuar tocando até o usuário tocar na tela | ✅ |
| F04 | Frase de ativação configurável | ✅ |
| F05 | Som padrão incluso (sem download) | ✅ (3 sons sintetizados) |
| F06 | Importar som customizado do dispositivo | ✅ |
| F07 | Toggle para ligar/desligar a escuta | ✅ |
| F08 | Indicador visual claro do estado | ✅ |

### 3.2 Modo silêncio

| ID | Requisito | Status |
|----|-----------|--------|
| S01 | Silenciar imediatamente por toque | ✅ |
| S02 | Silenciar por período (30 min / 1 h / 2 h) | ✅ |
| S03 | Retomar automaticamente após o período | ✅ (timestamp persistido) |
| S04 | Indicador de tempo restante | ✅ |

### 3.3 Som e personalização

| ID | Requisito | Status |
|----|-----------|--------|
| P01 | Selecionar entre sons inclusos (mín. 3) | ✅ |
| P02 | Importar arquivo de áudio | ✅ |
| P03 | Preview de 3 segundos | ✅ |
| P04 | Volume de teste | ✅ |

### 3.4 Comportamento offline

| ID | Requisito | Status |
|----|-----------|--------|
| O01 | Tudo funciona sem internet | ✅ (modelo Vosk embarcado) |
| O02 | Sons salvos localmente | ✅ |
| O03 | Configurações persistem após reiniciar | ✅ |

### 3.5 Conformidade (lojas / LGPD)

| ID | Requisito | Status |
|----|-----------|--------|
| C01 | Política de privacidade acessível no app | ✅ |
| C02 | Permissão de microfone com justificativa | ✅ |
| C03 | Excluir todos os dados locais | ✅ |
| C04 | Declaração de que nenhum áudio é gravado/enviado | ✅ |

### 3.6 Onboarding (seção 6 dos requisitos)

| Item | Status |
|------|--------|
| Máximo de 4 telas até o app funcional | ✅ (Boas-vindas → Permissões → Frase → Teste) |
| Fluxo "configurar para outra pessoa" | ✅ (nome opcional; alarme cumprimenta) |
| Sem criação de conta/login | ✅ |
| Instruções de bateria por fabricante (Xiaomi/Samsung/Motorola) | ✅ |

---

## 4. Funcionalidades implementadas (detalhe)

### 4.1 Escuta e disparo
- Reconhecimento da frase com **correspondência tolerante**: ignora acentos/pontuação/maiúsculas, exige a palavra-**âncora** (mais distintiva, ex.: "celular") e aceita perder ~1 palavra — reduz a necessidade de repetir a frase, sem falso positivo com frases comuns ("cadê você").
- Alarme em loop, volume máximo, **sobre o modo silencioso**, com vibração; para ao toque na tela.
- **Cooldown anti-duplo-disparo**: ignora re-disparos nos 2 s após silenciar (evita o alarme tocar duas vezes).

### 4.2 Escuta em background (Android — Fase 4 antecipada)
- `VoiceListenerService`: **Foreground Service `microphone`** rodando **Vosk** local, funciona com a **tela apagada**, com `PARTIAL_WAKE_LOCK` e notificação persistente.
- **Notificação com ação "Parar"**: silencia o alarme **sem precisar abrir o app**.
- Roteamento automático: serviço nativo no Android; caminho JS no iOS/Expo Go.

### 4.3 Sons
- 3 sons embutidos sintetizados (Alerta clássico, Sino suave, Sirene).
- Importação de áudio do aparelho (copiado para uso offline).
- Preview de 3 s e teste de volume.
- **Tratamento de fone (BUG-001)**: com fone conectado, não estoura o volume nos ouvidos — reduz o volume e reforça a vibração.

### 4.4 Privacidade e dados
- Política de privacidade em linguagem simples, dentro do app.
- Permissão de microfone com justificativa clara.
- "Apagar todos os dados" (reset de fábrica, LGPD).
- Processamento 100% local; nenhum áudio gravado, armazenado ou transmitido.

---

## 5. Bugs encontrados em campo e corrigidos

| ID | Sintoma | Causa | Status |
|----|---------|-------|--------|
| BUG-001 | Alarme no fone, risco aos ouvidos | Roteamento de áudio | ✅ Mitigado (volume seguro + vibração) |
| BUG (build) | `compileSdk 28` da lib de fone | Lib de 2022 | ✅ Override de Gradle |
| BUG (runtime) | Crash no boot (`RECEIVER_NOT_EXPORTED`) | Lib não adaptada ao Android 13+ | ✅ `patch-package` |
| BUG (modelo) | "Reconhecimento de voz indisponível" | Faltava o arquivo `uuid` exigido pelo Vosk | ✅ `uuid` gerado pelo script |
| BUG (recon.) | Precisa repetir a frase 3–4× | Casamento estrito demais | ✅ Casamento tolerante (âncora + ~60%) |
| BUG (alarme) | Toca 2× seguidas | Detecção residual após parar | ✅ Cooldown de 2 s |
| BUG (alarme) | Som atrasa e não para (precisava limpar dados) | Corrida entre `createAsync` e `stop` | ✅ Token de geração |
| BUG (sons) | Som padrão muda após customizado | Foco de áudio preso (som não descarregado) | ✅ `unload` garantido em todos os caminhos |

---

## 6. Arquitetura (estrutura de pastas)

```
App.tsx                       Raiz: roteamento + deep link cade://tocar (Siri)
src/
  context/AppContext.tsx      Estado global: escuta, alarme, silêncio, persistência
  services/
    voice.ts                  Escuta JS (iOS / Expo Go)
    nativeVoice.ts            Ponte JS → VoiceListenerService nativo (Android)
    alarm.ts                  Alarme: volume máximo, ciclo de vida, fone, logs
    audioRoute.ts             Detecção de fone (BUG-001)
    notifications.ts          Aviso de pausa (iOS/JS)
    sounds.ts                 Sons embutidos + importação
    storage.ts                AsyncStorage (offline-first)
    permissions.ts            Permissão de microfone (C02)
    battery.ts                Instruções de bateria por fabricante
  screens/                    Onboarding (4 telas) + Home, Configurações, Sons,
                              Privacidade, Ajuda (bateria/Siri)
  utils/text.ts               Normalização e correspondência da frase
assets/sounds/                3 sons padrão (F05/P01)
scripts/                      Geração de sons, teste de frase, download do modelo
android/app/src/main/java/com/cade/app/   (fora do Git — ver seção 8)
  VoiceListenerService.kt     Foreground Service + Vosk (escuta com tela apagada)
  VoiceListenerModule.kt      Bridge nativo → React Native
  VoiceListenerPackage.kt     Registro do módulo
```

---

## 7. Build e distribuição

- **Rodar em desenvolvimento:** `npm install` → `npm run fetch-vosk-model` → `npx expo run:android` (aparelho físico; o modelo Vosk de ~50 MB é obrigatório antes do build).
- **Distribuir para outros aparelhos sem o PC de cada um:** gerar **um APK standalone de release** (`cd android && .\gradlew.bat assembleRelease`) e compartilhar o arquivo (Drive/WhatsApp). Em cada aparelho: permitir fontes desconhecidas, instalar, conceder microfone/notificações e liberar a otimização de bateria.
- Verificações automáticas: `tsc --noEmit`, bundle do Metro, `expo-doctor` (18/18) e `npm run test:phrase` (lógica de detecção).

---

## 8. Limitações conhecidas e próximos passos

- **`android/` é editado à mão e não versionado.** O código nativo do `VoiceListenerService` é reproduzido localmente. Para **EAS Build / Play Store**, será preciso versionar o `android/` (com hook que baixa o modelo) **ou** migrar as peças nativas para config plugins.
- **Parar o alarme com o app fechado:** a ação "Parar" na notificação resolve; a sobreposição de tela cheia só aparece com o app aberto.
- **MIUI/HyperOS (Xiaomi):** exige liberar a otimização de bateria para a escuta sobreviver (o onboarding orienta).
- **Precisão do reconhecimento:** o modelo pequeno do Vosk erra esporadicamente; se a captação ainda for fraca, o próximo nível é o **modo gramática do Vosk** (reconhecedor restrito à frase de ativação).
- **`expo-av`** será descontinuado no SDK 54 — migrar para `expo-audio`/`expo-video` em uma versão futura.
- **Assinatura:** o APK de release usa a chave de debug (serve para sideload). Para atualizações sem desinstalar / Play Store, gerar uma keystore de release própria.

---

## 9. Critérios de validação (Fase 1 → Fase 2)

As metas da seção 8 do documento de requisitos (retenção D7 > 40%, D30 > 20%, NPS > 50, 500 usuários ativos, conclusão de onboarding > 70%) **ainda não foram medidas** — dependem de distribuição e analytics, próximos passos do produto.

---

*Documento gerado a partir do estado real do código em 12/06/2026.*
