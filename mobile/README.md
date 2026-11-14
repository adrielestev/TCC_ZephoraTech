# Zephora App

App nativo (Android e iOS) e web do Zephora, com a mesma base de código.
Expo SDK 58 · React Native · React Native Web · Expo Router · axios · TanStack Query · react-hook-form + zod.

## Rodando

```bash
npm install
cp .env.example .env     # defina EXPO_PUBLIC_API_URL
npm run web              # navegador (http://localhost:8081)
npm run android          # ou: npm run ios / npm start (QR code no Expo Go)
npm run typecheck        # checagem de tipos
npm run build:web        # build estático da web (pasta dist/)
```

`EXPO_PUBLIC_API_URL` é o endereço da API **sem** `/api`. Se ficar vazio ou não for definido, o app identifica automaticamente o ambiente durante o desenvolvimento:

| Onde roda | Valor |
|---|---|
| Web / iOS Simulator | `http://localhost:3333` |
| Emulador Android | `http://10.0.2.2:3333` |
| Celular físico | `http://IP-DO-SEU-PC:3333` |

No dispositivo físico, o host é obtido automaticamente do servidor Expo. Em produção, configure uma URL HTTPS explícita.

Na web, a origem do app precisa estar em `CORS_ORIGINS` no `.env` da API (ex.: `http://localhost:8081`).
Em produção use HTTPS e inclua a origem publicada em `CORS_ORIGINS`.

## Estrutura

```
src/
  app/            rotas do Expo Router (arquivos finos que só reexportam a tela)
  core/           api (axios, erros, upload), auth, storage, query, hooks, tipos
  ui/             design system: Screen, Button, TextField, Card, Badge, Feedback...
  features/       auth · rooms · devices · automations · esp32 · users · profile · admin
    <feature>/    api.ts · hooks.ts · components/ · screens/
```

Cada feature segue: **api** (chamadas HTTP) → **hooks** (TanStack Query) → **screens/components**.

## Telas e rotas (fluxograma aprovado)

| Fluxo | Rota | Quem |
|---|---|---|
| 1 Acesso | `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password` | público |
| 2 Navegação | `/` (Salas), `/profile`, `/rooms/[roomId]` | logado |
| 2 Navegação | `/admin` (aba Administração) | admin |
| 3 Salas | `/rooms/new`, `/rooms/[roomId]/edit`, `/access` | admin |
| 3 Aparelhos | `/rooms/[roomId]/devices/[deviceId]` | admin |
| 3 Automações | `/rooms/[roomId]/automations/new`, `/automations/[automationId]` | admin |
| 4 ESP32 | `/admin/esp32`, `/admin/esp32/new` (4 passos), `/admin/esp32/[esp32Id]` | admin |
| 5 Usuários | `/admin/users`, `/admin/users/[userId]` | admin (promover: só o owner) |

- **Navegação**: abas inferiores no celular; menu lateral na web/tablet (largura ≥ 900 px).
- **Rotas protegidas**: `Stack.Protected` em `app/_layout.tsx` (logado × deslogado) e em `app/(app)/_layout.tsx` (telas de admin). Ao sair ou expirar a sessão, o app volta ao login sozinho.
- **Sessão**: token JWT guardado no Keychain/Keystore (`expo-secure-store`); na web, em `localStorage`. Token recusado (401 `INVALID_TOKEN`) encerra a sessão e avisa o usuário.
- **Tempo real**: aparelhos da sala atualizam a cada 5 s; o passo "aguardando o ESP32" consulta a cada 3 s e avança sozinho quando ele fica online.
- **Resposta imediata**: ligar/desligar e pausar automação atualizam na hora (otimista) e voltam atrás se a API recusar. "Aplicando..." aparece até o ESP32 confirmar.
- **Confirmações** (excluir, desativar, sair) usam um diálogo próprio, pois `Alert.alert` não funciona na web.
- **Fotos**: seletor do sistema (`expo-image-picker`), envio multipart; a API valida o tipo real (JPEG/PNG/WebP, até 5 MB).

## Observações

- Tipos de aparelho: `src/features/devices/deviceTypes.ts` (espelha `device-types.js` da API).
- Mensagens de erro da API estão traduzidas em `src/core/api/errors.ts`.
- Só tema claro por enquanto; cores e espaçamentos centralizados em `src/ui/theme/`.
- Sem testes automatizados de interface ainda: a verificação feita foi typecheck e build web/Android.

---

## Design system e arquitetura (redesign)

Referências: o fluxograma do Miro (rotas e regras) e o **shadcn/ui** (variantes de Button, Card, Badge, Alert, Skeleton e Item), traduzidos para React Native.

**Tema** — `src/ui/theme/` (entrada única: `import { colors, spacing } from '@/ui/theme'`)
`colors` · `spacing`/`radius` · `type` (rampa tipográfica) · `shadows` · `motion` · `layout` (larguras e breakpoint).

**Componentes** — `src/ui/`

| Componente | Uso |
|---|---|
| `Button` | variantes `primary`, `secondary`, `outline`, `ghost`, `danger`; tamanhos `sm`/`md`/`lg` |
| `Card` + `CardHeader`/`CardContent`/`CardFooter` | superfície padrão |
| `ListItem` + `IconTile` | linhas de lista (usuários, módulos, atalhos) |
| `Badge`, `Banner` (Alert), `Skeleton`, `EmptyState` | status e estados de tela |
| `PageHeader`, `Section`, `Grid` | layout de telas (grade responsiva) |
| `Screen` | rolagem, teclado, largura máxima (`form` 560 · `content` 720 · `wide` 1040), rodapé fixo |
| `AppSwitch`, `TextField`, `Chip`, `CheckRow`, `StepIndicator` | formulários e assistentes |

**Navegação**
- `src/core/navigation/routes.ts`: **único lugar com os caminhos** (`routes.room(id)`, `routes.login`...). Telas nunca usam strings soltas.
- `src/features/shell/`: `AppTabBar` vira **menu lateral** (>= 900 px: web/tablet) ou **barra inferior** (celular). A aba Administração só existe para admin (`Tabs.Protected`).
- O navegador raiz só monta depois que a sessão é restaurada, então links diretos (ex.: `/rooms/1`) são preservados.

**API:** `core/api`, `core/auth`, `core/query` e todos os `api.ts`, `hooks.ts` e `schemas.ts` das features não foram alterados.
