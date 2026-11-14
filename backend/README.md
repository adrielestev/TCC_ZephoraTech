# Zephora — Backend

API do sistema institucional de automação de salas (ESP32).
Node.js ≥ 22.13 · Express 5 · `node:sqlite` · JWT · Nodemailer · Zod.

## Rodando

```bash
npm install
cp .env.example .env          # preencha JWT_SECRET e CODE_HMAC_SECRET (comando no próprio arquivo)
OWNER_EMAIL=admin@escola.com OWNER_PASSWORD='uma-senha-forte' npm run db:seed
npm run dev                   # ou: npm start
npm test                      # 22 testes de ponta a ponta (banco em memória)
```

Sem `SMTP_HOST`, em desenvolvimento os códigos de 6 dígitos são impressos no console.
Em produção `SMTP_HOST` é obrigatório (a API não sobe sem ele).

## Estrutura

```
src/
  config/env.js            variáveis de ambiente validadas (falha ao subir se inválidas)
  database/                db.js (conexão, transaction), schema.sql, seed-owner.js
  shared/                  errors, crypto, files, mailer, roles, schemas
    middlewares/           authenticate, authorize, authenticateEsp32, validate,
                           rateLimiters, upload, errorHandler
  modules/<nome>/          routes → controller → service → repository (+ schemas)
    auth · users · rooms · esp32 · devices · automations · sync
```

## Endpoints

Erros: `{ "error": { "code", "message", "details?" } }`. Listas: `{ "data": [...] }`.
Autenticação de usuário: `Authorization: Bearer <token>`.

| Método | Rota | Quem | Descrição |
|---|---|---|---|
| POST | `/api/auth/register` | público | Cadastro (resposta sempre genérica) + código por e-mail |
| POST | `/api/auth/verify-email` | público | `{email, code}` |
| POST | `/api/auth/resend-verification` | público | `{email}` |
| POST | `/api/auth/login` | público | `{email, password}` → `{token, user}` (403 `EMAIL_NOT_VERIFIED` se pendente) |
| POST | `/api/auth/forgot-password` | público | `{email}` |
| POST | `/api/auth/reset-password` | público | `{email, code, newPassword}` |
| GET | `/api/auth/me` | logado | Usuário atual |
| PATCH | `/api/users/me` | logado | `{name}` |
| PUT/DELETE | `/api/users/me/avatar` | logado | Campo multipart `avatar` |
| GET | `/api/users?q=&limit=&offset=` | admin | Lista/busca |
| GET | `/api/users/:id` | admin | |
| PATCH | `/api/users/:id/role` | **owner** | `{role: "admin" ou "member"}` |
| PATCH | `/api/users/:id/status` | admin | `{isActive}` |
| GET/PUT | `/api/users/:id/rooms` | admin | `{roomIds: []}` substitui as salas do usuário comum |
| GET | `/api/rooms` | logado | Admin: todas · comum: só as suas |
| POST | `/api/rooms` | admin | `{name, description?}` |
| GET | `/api/rooms/:roomId` | acesso à sala | |
| PATCH/DELETE | `/api/rooms/:roomId` | admin | Exclusão bloqueada se houver aparelhos |
| GET | `/api/rooms/:roomId/access` | admin | Usuários com acesso |
| PUT/DELETE | `/api/rooms/:roomId/photos/:slot` | admin | `slot` 1–3, campo multipart `photo` |
| POST | `/api/esp32` | admin | `{credential, name?}` (passo 1) |
| GET | `/api/esp32` · `/api/esp32/:id` | admin | Status e aparelhos reportados (passo 2) |
| POST | `/api/esp32/:id/devices` | admin | `{devices:[{deviceId, roomId, name?}]}` (passo 3) |
| DELETE | `/api/esp32/:id` | admin | |
| GET | `/api/devices?roomId=` | acesso à sala | |
| PUT | `/api/devices/:id/state` | acesso à sala | `{state:{on:true}}` |
| PATCH/DELETE | `/api/devices/:id` | admin | Renomear/mover · descadastrar |
| GET | `/api/automations?roomId=` | acesso à sala | |
| POST | `/api/automations` | admin | `{roomId, name, triggers[], actions[]}` |
| PATCH/DELETE | `/api/automations/:id` | admin | |
| PUT | `/api/automations/:id/pause` | acesso à sala | `{paused: true ou false}` |
| POST | `/api/device-sync` | **ESP32** | Polling do firmware |

Exemplo de automação:
```json
{ "roomId": 1, "name": "Acender luz ao detectar movimento",
  "triggers": [{ "deviceId": 3, "condition": { "presence": true } }],
  "actions":  [{ "deviceId": 1, "state": { "on": true } }] }
```
Gatilhos: só sensores; ações: só aparelhos controláveis; todos na mesma sala. Com vários gatilhos, **todos** precisam estar satisfeitos. A automação dispara na **mudança** do sensor (não reaplica enquanto a presença continua).

## Protocolo do ESP32

Autenticação: header `X-ESP32-Credential` (32–128 caracteres `[A-Za-z0-9_-]` gerados pelo ESP32, ex.: 32 bytes aleatórios em hex). Use **HTTPS**.

```http
POST /api/device-sync
X-ESP32-Credential: <credencial>
Content-Type: application/json

{ "firmware": "1.0.0",
  "devices": [
    { "channel": "relay_1", "type": "light",           "name": "Luz do quadro", "state": { "on": false } },
    { "channel": "pir_1",   "type": "presence_sensor", "name": "Presença",      "state": { "presence": false } } ] }
```
```json
{ "serverTime": "...", "pollIntervalMs": 3000,
  "commands": [ { "channel": "relay_1", "state": { "on": true } } ] }
```
Fluxo: o admin cadastra a credencial (`pending`) → o ESP32 faz o primeiro sync (`online`; aparelhos novos ficam `discovered`) → o admin escolhe quais cadastrar e em qual sala. A cada sync o ESP32 envia os estados atuais e aplica os `commands`. Sem sync por `ESP32_OFFLINE_AFTER_SECONDS`, o módulo vira `offline`.
Novos tipos de aparelho: `modules/devices/device-types.js` + CHECK de `devices.type` no `schema.sql`.

## Segurança

- **Senhas**: bcrypt (custo 12), máx. 72 bytes; hash fictício no login para igualar o tempo quando o e-mail não existe.
- **JWT**: HS256 fixo, `issuer`, expiração configurável. Papel, status e senha são relidos do banco a cada requisição: promoção/desativação valem na hora e **trocar a senha invalida os tokens antigos**.
- **Anti-enumeração**: cadastro, reenvio e "esqueci a senha" respondem sempre igual.
- **Códigos de 6 dígitos**: CSPRNG, guardados como HMAC-SHA256 (vinculado ao usuário e à finalidade), validade, uso único, limite de tentativas e intervalo de reenvio; comparação em tempo constante.
- **ESP32**: só o SHA-256 da credencial é guardado; ela nunca é devolvida pela API.
- **Autorização**: papéis `owner` / `admin` / `member`; sala sem permissão responde 404; owner protegido; só o owner promove.
- **Entrada**: Zod `.strict()` em todos os corpos, SQL parametrizado (colunas dinâmicas só de allowlists), limite de 100 KB por JSON.
- **Uploads**: tipo verificado pelos bytes (JPEG/PNG/WebP; SVG recusado), máx. 5 MB, nome aleatório, escrita só dentro de `UPLOAD_DIR`.
- **HTTP**: helmet, CORS liberal, rate limit global, por IP+e-mail (login/códigos) e por ESP32; erros internos sem vazar detalhes.
- **Banco**: `foreign_keys` ligadas, `CHECK` nos enums, transações nas operações compostas.

## Limitações conhecidas

- Só access token (sem refresh). Para sessões longas, adicione refresh token.
- Schema aplicado com `IF NOT EXISTS` a cada start: mudanças futuras exigem migrações.
- Sem edição de gatilhos/ações de uma automação (apague e recrie).
- Atrás de proxy reverso com HTTPS, configure `TRUST_PROXY` para o rate limit enxergar o IP real.
- Backup: o banco é um arquivo (`DB_PATH`, modo WAL); faça backup junto com `UPLOAD_DIR`.
