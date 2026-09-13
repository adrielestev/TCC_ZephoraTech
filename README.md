# Zephora Backend

Backend REST em JavaScript para automacao de salas com ESP32.

## Stack

- Node.js 24+
- Express
- SQLite + Knex
- Zod
- JWT
- Nodemailer

## Arquitetura

O projeto usa Layered Architecture:

- `src/routes`: declara rotas, middlewares e validacoes.
- `src/controllers`: recebe HTTP e formata respostas.
- `src/services`: concentra regras de negocio.
- `src/repositories`: isola acesso ao SQLite/Knex.
- `src/schemas`: schemas Zod de entrada.
- `src/middlewares`: autenticacao, autorizacao e tratamento de erros.

## Como rodar

```bash
npm install
cp .env.example .env
npm run migrate
npm run seed
npm run dev
```

No Windows PowerShell, se preferir:

```powershell
Copy-Item .env.example .env
npm run migrate
npm run seed
npm run dev
```

A API sobe em `http://localhost:3000`.

## Insomnia

Importe a colecao em:

```text
insomnia/zephora-api-insomnia.json
```

Depois do login, copie o `token` retornado para a variavel `token` do ambiente da colecao.

## Admin inicial

O seed cria um administrador usando as variaveis do `.env`:

- e-mail: `admin@zephora.local`
- senha: `Admin@123456`

Troque esses valores antes de usar fora do ambiente local.

## Rotas principais

### Autenticacao

- `POST /auth/register`
- `POST /auth/verify-email`
- `POST /auth/resend-code`
- `POST /auth/login`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/me`

### Usuarios

- `PATCH /users/me`
- `GET /users` admin
- `PATCH /users/:id/level` admin
- `DELETE /users/:id` admin, soft delete

### Salas

- `GET /rooms`
- `POST /rooms` admin
- `GET /rooms/:id`
- `PATCH /rooms/:id` admin
- `DELETE /rooms/:id` admin
- `POST /rooms/:id/handshake` ESP32
- `GET /rooms/:roomId/commands?mac_address=AA:BB:CC:DD:EE:FF` ESP32

### Colaboradores

- `GET /rooms/:roomId/collaborators` admin
- `POST /rooms/:roomId/collaborators` admin
- `DELETE /rooms/:roomId/collaborators/:id` admin

### Sensores

- `GET /sensors`
- `POST /sensors` admin
- `GET /sensors/:id`
- `PATCH /sensors/:id` admin
- `DELETE /sensors/:id` admin
- `POST /sensors/:id/command` admin ou colaborador da sala
- `POST /sensors/rooms/:roomId/:deviceKey/state` ESP32

## Fluxo ESP32

1. Ao ligar, o ESP32 chama `POST /rooms/:id/handshake` com `user_id`, `room_id` e `mac_address`.
2. Para buscar comandos dos atuadores, chama `GET /rooms/:roomId/commands?mac_address=AA:BB:CC:DD:EE:FF`.
3. Para atualizar leitura/estado de um dispositivo, chama `POST /sensors/rooms/:roomId/:deviceKey/state`.

## E-mail em desenvolvimento

Se `SMTP_HOST` estiver vazio, o Nodemailer usa transporte JSON e imprime o e-mail no console. Isso permite testar os codigos sem SMTP real.
