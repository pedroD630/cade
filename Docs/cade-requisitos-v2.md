# Cadê? — Documento de Requisitos v2.0

> **"Celular, cadê você?"** → o celular responde em volume máximo, onde quer que esteja.

**Versão:** 2.0 — revisada após análise de priorização  
**Data:** Junho de 2025  
**Estratégia:** custo zero na fase 1, escala gradual conforme validação de usuário

---

## Sumário

1. [Visão do produto](#1-visão-do-produto)
2. [Público-alvo e canal de distribuição](#2-público-alvo-e-canal-de-distribuição)
3. [Princípios de desenvolvimento](#3-princípios-de-desenvolvimento)
4. [Stack tecnológica — fase 1](#4-stack-tecnológica--fase-1)
5. [Requisitos do MVP](#5-requisitos-do-mvp)
6. [Onboarding simplificado](#6-onboarding-simplificado)
7. [Segurança e privacidade](#7-segurança-e-privacidade)
8. [Critérios de validação](#8-critérios-de-validação)
9. [Evolução do produto — fases futuras](#9-evolução-do-produto--fases-futuras)
10. [Estrutura de custos](#10-estrutura-de-custos)

---

## 1. Visão do produto

**Cadê?** é um aplicativo mobile que permite ao usuário localizar o celular dentro de casa usando apenas a voz. Ao dizer uma frase configurável (padrão: *"Celular, cadê você?"*), o dispositivo responde tocando um som em volume máximo — ignorando o modo silencioso — facilitando a localização imediata.

### Problema central

Pessoas — em especial idosos, pessoas com TDAH e qualquer pessoa com rotina agitada — perdem frequentemente o celular dentro de casa. As soluções existentes (Find My Device, Find My) são desconhecidas pelo público-alvo ou exigem outro dispositivo para acionar.

### Proposta de valor

- Funciona com a voz, sem precisar de outro dispositivo
- Funciona offline, sem depender de internet
- Configuração simples o suficiente para qualquer pessoa usar
- Diferencial emocional futuro: o celular responde com uma voz personalizada ("Estou aqui, vovó!")

---

## 2. Público-alvo e canal de distribuição

### Usuário primário
Pessoas que perdem o celular dentro de casa com frequência: idosos, adultos com TDAH, pais com filhos pequenos, pessoas em casas grandes.

### Configurador (persona distinta)
**Filhos, sobrinhos e cuidadores** que instalam e configuram o app para um familiar. Este é o principal canal de aquisição orgânica e o onboarding precisa contemplar explicitamente esse fluxo: *"Configurar para outra pessoa"*.

> **Implicação de design:** quem configura não é quem usa. O onboarding deve ser rápido para o configurador e invisível para o usuário final.

---

## 3. Princípios de desenvolvimento

1. **Custo zero até validação** — nenhuma dependência paga antes de 500 usuários ativos retidos
2. **APIs nativas primeiro** — usar recursos do SO antes de construir infraestrutura proprietária
3. **Offline-first** — todas as funcionalidades do MVP funcionam sem internet
4. **Uma coisa por vez** — o app faz uma coisa muito bem antes de fazer dez coisas razoavelmente
5. **Onboarding em 2 telas** — se o usuário não conseguir usar sozinho na segunda tentativa, o produto falhou

---

## 4. Stack tecnológica — fase 1

| Camada | Tecnologia | Custo | Justificativa |
|--------|-----------|-------|---------------|
| Framework mobile | React Native + Expo (bare workflow) | Gratuito | Cross-platform, suporte a permissões nativas necessárias |
| Detecção de voz | `@react-native-voice/voice` (API nativa do SO) | Gratuito | SpeechRecognizer (Android) + SpeechRecognition (iOS) sem custo |
| Reprodução de som | `expo-av` com `AudioMode.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX` | Gratuito | Toca sobre modo silencioso via STREAM_ALARM |
| Armazenamento local | `AsyncStorage` + arquivos locais | Gratuito | Sem banco de dados para MVP |
| Autenticação | Nenhuma — app local | Gratuito | Sem backend no MVP |
| Backend | Nenhum — fase 1 é 100% local | R$ 0/mês | Reduz complexidade e custo |
| Analytics | Expo Application Services (básico) | Gratuito | Métricas essenciais para validação |

### Notas técnicas importantes

**Android — background listening:**  
Requer `Foreground Service` com notificação persistente (obrigatório no Android 14+). O onboarding deve incluir instruções de configuração de bateria por fabricante (Xiaomi, Samsung, Motorola), pois esses fabricantes matam processos em background agressivamente.

**iOS — alternativa ao microfone contínuo:**  
Usar **Siri Shortcuts** no iOS elimina a necessidade de microfone contínuo, contornando restrições da App Store. O usuário configura um atalho de voz no próprio Siri que abre o app e dispara o som. No Android, o Foreground Service resolve o listening contínuo.

**Volume máximo sobre silencioso:**  
- Android: `AudioManager.STREAM_ALARM` ignora modo silencioso por design do SO
- iOS: `AVAudioSession` com categoria `playback` + `AVAudioSessionCategoryOptionDuckOthers`

---

## 5. Requisitos do MVP

### 5.1 Funcionalidade principal

| ID | Requisito | Prioridade |
|----|-----------|-----------|
| F01 | Ao detectar a frase configurada, tocar som em volume máximo | Crítica |
| F02 | Ignorar modo silencioso / não perturbe ao disparar o som | Crítica |
| F03 | Continuar tocando até o usuário tocar na tela | Crítica |
| F04 | Frase de ativação configurável pelo usuário | Alta |
| F05 | Som padrão incluso no app (MP3 local, sem download) | Crítica |
| F06 | Importar um som customizado do próprio dispositivo (MP3, M4A) | Alta |
| F07 | Toggle simples para ligar/desligar a escuta | Crítica |
| F08 | Indicador visual claro do estado atual (ouvindo / silenciado) | Alta |

### 5.2 Modo silêncio

| ID | Requisito | Prioridade |
|----|-----------|-----------|
| S01 | Silenciar imediatamente por toque | Crítica |
| S02 | Silenciar por período definido na hora (ex: "por 2 horas") | Alta |
| S03 | Retomar automaticamente após o período definido | Alta |
| S04 | Indicador visual de tempo restante do silêncio | Média |

> **Fora do MVP:** agendamento recorrente (RRULE/iCal), perfis de silêncio por local. Esses requisitos entram na fase 2.

### 5.3 Som e personalização

| ID | Requisito | Prioridade |
|----|-----------|-----------|
| P01 | Selecionar entre sons inclusos (mínimo 3 opções) | Alta |
| P02 | Importar arquivo de áudio do dispositivo | Alta |
| P03 | Preview de 3 segundos antes de confirmar o som | Média |
| P04 | Volume de teste para confirmar que está audível | Média |

### 5.4 Comportamento offline

| ID | Requisito | Prioridade |
|----|-----------|-----------|
| O01 | Todas as funcionalidades funcionam sem internet | Crítica |
| O02 | Sons selecionados ficam salvos localmente | Crítica |
| O03 | Configurações persistem após reiniciar o app | Crítica |

### 5.5 Conformidade (obrigatório para publicação nas lojas)

| ID | Requisito | Prioridade |
|----|-----------|-----------|
| C01 | Política de privacidade clara e acessível no app | Crítica |
| C02 | Solicitar permissão de microfone com justificativa clara | Crítica |
| C03 | Opção de excluir todos os dados locais | Alta |
| C04 | Declaração de que nenhum áudio é gravado ou enviado | Crítica |

---

## 6. Onboarding simplificado

O onboarding é a funcionalidade mais crítica do produto. Um fluxo complexo mata a adoção antes que o usuário experimente o valor real.

### Fluxo padrão (usuário configura para si mesmo)

```
Tela 1 — Boas-vindas
  └─ Explica o que o app faz em 2 frases
  └─ Botão: "Configurar agora" / "Configurar para outra pessoa"

Tela 2 — Permissões
  └─ Solicita permissão de microfone
  └─ Exibe mensagem: "Seu áudio nunca é gravado nem enviado"
  └─ Android: abre configuração de bateria do fabricante se necessário

Tela 3 — Frase de ativação
  └─ Campo editável com padrão pré-preenchido: "Celular, cadê você?"
  └─ Botão: "Usar essa frase" / "Quero personalizar"

Tela 4 — Teste
  └─ Instrução: "Diga a frase agora para testar"
  └─ Feedback visual ao detectar ("Funcionou!")
  └─ Botão: "Tentar de novo" / "Pronto, vamos usar!"

→ App ativo, tela principal
```

### Fluxo alternativo — configurar para outra pessoa

```
Após "Configurar para outra pessoa":
  └─ "Quem vai usar o app?" — campo de nome (opcional, para o app cumprimentar)
  └─ Mesmo fluxo de permissões e frase
  └─ Tela de teste: "Peça para [nome] dizer a frase"
  └─ Confirmação: "Tudo pronto! [Nome] já pode chamar o celular"
```

### Regras de onboarding

- Máximo de 4 telas antes de o app estar funcional
- Nenhuma criação de conta ou login no MVP
- Configurações avançadas (sensibilidade, sons, silêncio) ficam em tela separada, não no onboarding
- Botão "Pular" nunca aparece em telas de permissão crítica

---

## 7. Segurança e privacidade

### Modelo de ameaça real (fase 1)

O risco principal é **ativação acidental por vozes de terceiros** (familiar, TV, vizinho). Não é um ataque malicioso remoto — e isso define as medidas necessárias.

| Ameaça | Probabilidade | Mitigação |
|--------|--------------|-----------|
| Voz de outra pessoa na casa ativa o app | Alta | Frase específica + toggle de silêncio fácil |
| TV ou rádio ativa acidentalmente | Média | Sensibilidade padrão conservadora; modo silêncio |
| App acessado por outra pessoa no dispositivo | Baixa | Proteção do SO (lock screen) é suficiente |
| Áudio captado enviado a servidores | Nenhuma | Processamento 100% local, declarado na política |

### Medidas de privacidade — fase 1

- Todo processamento de voz ocorre no dispositivo, usando APIs nativas do SO
- Nenhum áudio é gravado, armazenado ou transmitido
- Configurações salvas em `AsyncStorage` local, sem sincronização
- Política de privacidade em linguagem simples, acessível na tela de permissões e no menu
- Conformidade com LGPD: dados mínimos (nenhum dado pessoal coletado no MVP), opção de reset total

> **Nota:** O voiceprint criptografado com AES-256 e Keychain, previsto na versão anterior, é over-engineering para o modelo de ameaça real desta fase. O reconhecimento de voz nativo do SO já tem suas próprias proteções. Essa feature pode ser reavaliada na fase 3 se o produto exigir autenticação por voz como fator de segurança.

---

## 8. Critérios de validação

Antes de investir em qualquer feature da fase 2, os seguintes números precisam ser atingidos:

| Métrica | Meta mínima | Como medir |
|---------|------------|-----------|
| Retenção D7 | > 40% | Expo Analytics / abertura do app |
| Retenção D30 | > 20% | Expo Analytics |
| NPS | > 50 | Survey in-app após 7 dias de uso |
| Usuários ativos | > 500 | Contagem de dispositivos com uso nos últimos 30 dias |
| Taxa de conclusão do onboarding | > 70% | Funnel de telas no Expo Analytics |
| Disposição a pagar | > 30% respondendo "sim" | Pergunta simples no survey: "Pagaria R$9,99/mês por vozes personalizadas?" |

> **Gate de fase:** nenhuma das features da fase 2 começa antes de todas as metas acima serem atingidas.

---

## 9. Evolução do produto — fases futuras

Esta seção descreve o roadmap **após validação do MVP**. Nenhum item aqui deve ser desenvolvido antes de atingir os critérios da seção 8.

---

### Fase 2 — Contas e sincronização
*Gatilho: 500 usuários ativos + retenção D30 > 20%*

**Objetivo:** Permitir que o usuário preserve suas configurações ao trocar de celular e habilitar múltiplos perfis.

**O que entra:**
- Autenticação via Supabase (e-mail + magic link — sem senha para reduzir fricção)
- Sincronização de configurações na nuvem (frase, sons, preferências)
- Múltiplos perfis de usuário no mesmo dispositivo (ex: marido e esposa)
- Agendamento de silêncio com recorrência (reuniões semanais, horário de dormir)
- Backup automático dos sons customizados no Supabase Storage

**Stack adicional:**
- Supabase free tier → Pro conforme crescimento (USD 25/mês a partir de ~500 usuários)
- RLS (Row Level Security) desde o início — cada usuário acessa apenas seus dados

**O que ainda não entra:** loja de sons, monetização, wake-word proprietário.

---

### Fase 3 — Loja de sons e monetização
*Gatilho: NPS > 50 + 30% dos usuários indicando disposição a pagar*

**Objetivo:** Transformar o diferenciador emocional ("voz personalizada") em receita recorrente.

**O que entra:**
- Catálogo de sons e vozes personalizadas (ex: "Estou aqui, vovó!" em voz humana)
- Preview de 5 segundos antes de comprar
- Compras avulsas (R$ 1,99–4,99) via RevenueCat (IAP nativo iOS + Android)
- Assinatura mensal opcional com acesso ao catálogo completo
- Criadores podem submeter vozes e receber royalties (versão simplificada)
- Curadoria editorial: pacotes temáticos (família, humor, natureza)

**Monetização esperada:**
- Ticket médio estimado: R$ 9,99/mês ou R$ 3,99 por voz avulsa
- 10.000 usuários ativos com 10% conversão = ~R$ 10.000 MRR

**Stack adicional:**
- RevenueCat (gratuito até USD 2.500/mês de receita)
- Supabase Storage para arquivos de áudio
- Edge Functions na Vercel para webhook de compra

---

### Fase 4 — Wake-word local proprietário
*Gatilho: > 10.000 usuários ativos + evidência de falhas no reconhecimento nativo*

**Objetivo:** Substituir o reconhecimento de voz nativo do SO por wake-word local para maior confiabilidade e independência total de internet.

**Por que esperar:**
- Porcupine customizado (frase em português) custa USD 3.000/ano ou USD 0,02/dispositivo/mês
- Com 10.000 usuários ativos: ~USD 200/mês — justificável apenas nessa escala
- O reconhecimento nativo do SO é suficiente e gratuito para as fases anteriores

**O que entra:**
- Wake-word model treinado com a frase em português brasileiro
- Modelo embarcado no app (funciona 100% offline, sem chamada de API)
- Suporte a variações de pronúncia e sotaque regional
- Ajuste de sensibilidade por perfil de usuário

---

### Fase 5 — Expansão de plataforma
*Gatilho: produto consolidado + oportunidade de mercado validada*

**Possibilidades (a avaliar com dados):**
- Integração com rastreadores Bluetooth (Tile, AirTag) — "Chaves, cadê vocês?"
- Versão para smartwatch (ativar sem precisar do celular)
- Modo cuidador: cuidador de idoso recebe notificação quando o celular foi encontrado
- Versão B2B para clínicas de reabilitação cognitiva e planos de saúde

---

## 10. Estrutura de custos

### Fase 1 — MVP (custo: R$ 0/mês)

| Item | Custo |
|------|-------|
| React Native + Expo | Gratuito |
| APIs nativas de voz do SO | Gratuito |
| Armazenamento local | Gratuito |
| Backend | Nenhum |
| Publicação App Store (taxa anual) | USD 99/ano (~R$ 500) |
| Publicação Google Play (taxa única) | USD 25 (~R$ 125) |
| **Total recorrente** | **R$ 0/mês** |
| **Total para publicar** | **~R$ 625 (uma vez)** |

### Fase 2 — Com Supabase

| Item | Custo |
|------|-------|
| Supabase free tier (até ~500 usuários) | Gratuito |
| Supabase Pro (acima disso) | USD 25/mês |
| Vercel Hobby | Gratuito |
| **Total estimado** | **USD 25/mês (~R$ 125)** |

### Fase 3 — Com loja de sons

| Item | Custo |
|------|-------|
| RevenueCat (até USD 2.500 MRR) | Gratuito |
| Supabase Pro + Storage | USD 25–50/mês |
| Vercel Pro (Edge Functions) | USD 20/mês |
| **Total estimado** | **USD 45–70/mês (~R$ 225–350)** |

### Fase 4 — Wake-word proprietário

| Item | Custo |
|------|-------|
| Porcupine (Picovoice) — 10k usuários | ~USD 200/mês |
| Infraestrutura fase 3 | USD 70/mês |
| **Total estimado** | **~USD 270/mês (~R$ 1.350)** |

---

## Apêndice — Decisões de arquitetura e justificativas

| Decisão | Alternativa considerada | Por que foi descartada |
|---------|------------------------|----------------------|
| APIs nativas de voz no MVP | Porcupine wake-word | USD 3.000/ano, wake-word PT-BR exige treinamento, custo inviável antes de validação |
| App 100% local no MVP | Supabase desde o início | Adiciona complexidade de auth/sync sem benefício antes de multiusuário |
| Siri Shortcuts no iOS | Microfone contínuo | Evita rejeição na App Store, usa infraestrutura confiável da Apple |
| Onboarding em 4 telas | Fluxo de 5 etapas com sensibilidade ajustável | Público-alvo abandona fluxos longos; sensibilidade vai para Configurações avançadas |
| Sem cadastro de conta no MVP | Auth por e-mail desde o início | Nenhuma funcionalidade no MVP exige servidor; conta seria fricção sem benefício |
| AsyncStorage local | WatermelonDB | WatermelonDB é over-engineering sem backend; AsyncStorage é suficiente para dados simples |

---

*Documento mantido em Markdown para facilitar versionamento em Git.*  
*Próxima revisão: após atingir os critérios de validação da seção 8.*
