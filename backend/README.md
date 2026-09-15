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

## Referência da API

Abaixo está a documentação completa dos endpoints, útil para integração do frontend/mobile e entendimento sem necessidade de analisar o código-fonte.

**Regras Gerais:**
- Rotas autenticadas exigem o cabeçalho `Authorization: Bearer <TOKEN>`.
- O prefixo da API base depende do ambiente (ex: `http://localhost:3000`).

### 1. Autenticação (`/auth`)

| Método | Rota | Autenticação | Corpo da Requisição (JSON) | Descrição |
|--------|------|--------------|-----------------------------|-----------|
| POST | `/auth/register` | Pública | `{ name (min: 2), email, password (min: 8), user_photo? }` | Registra um novo usuário. |
| POST | `/auth/verify-email` | Pública | `{ email, code (6 dígitos) }` | Verifica o email do usuário. |
| POST | `/auth/resend-code` | Pública | `{ email }` | Reenvia o código de verificação. |
| POST | `/auth/login` | Pública | `{ email, password }` | Retorna o token JWT e dados do usuário. |
| POST | `/auth/forgot-password` | Pública | `{ email }` | Solicita reset de senha. |
| POST | `/auth/reset-password` | Pública | `{ email, code, password }` | Define uma nova senha usando o código. |
| GET | `/auth/me` | Bearer Token | - | Retorna os dados do usuário autenticado. |

### 2. Usuários (`/users`)

| Método | Rota | Autenticação | Corpo da Requisição (JSON) / FormData | Descrição |
|--------|------|--------------|----------------------------------------|-----------|
| PATCH | `/users/me` | Bearer Token | `{ name?, user_photo? }` | Atualiza o próprio perfil. |
| POST | `/users/me/photo` | Bearer Token | `FormData: { photo: arquivo }` | Atualiza/Adiciona a foto de perfil. |
| DELETE | `/users/me/photo` | Bearer Token | - | Remove a foto de perfil. |
| GET | `/users` | Admin | - | Lista todos os usuários. |
| PATCH | `/users/:id/level` | Admin | `{ user_level: "USER" \| "ADMIN" }` | Altera o nível de acesso do usuário. |
| DELETE | `/users/:id` | Admin | - | Soft delete de um usuário. |

### 3. Salas (`/rooms`)

| Método | Rota | Autenticação | Corpo da Requisição (JSON) | Descrição |
|--------|------|--------------|-----------------------------|-----------|
| GET | `/rooms` | Bearer Token | - | Lista as salas disponíveis. |
| POST | `/rooms` | Admin | `{ name, classroom_code, mac_address, room_photo_1?, room_photo_2?, room_photo_3? }` | Cria uma nova sala. |
| GET | `/rooms/:id` | Bearer Token | - | Detalhes de uma sala. |
| PATCH | `/rooms/:id` | Admin | Propriedades parciais de Room (ex: `name`) | Atualiza dados da sala. |
| POST | `/rooms/:id/photos/:slot` | Admin | `FormData: { photo: arquivo }` (Slot: 1, 2, ou 3) | Atualiza foto no slot. |
| DELETE | `/rooms/:id/photos/:slot` | Admin | - | Remove a foto do slot. |
| DELETE | `/rooms/:id` | Admin | - | Exclui a sala. |

### 4. Colaboradores (`/rooms/:roomId/collaborators`)

| Método | Rota | Autenticação | Corpo da Requisição (JSON) | Descrição |
|--------|------|--------------|-----------------------------|-----------|
| GET | `/rooms/:roomId/collaborators`| Admin | - | Lista colaboradores da sala. |
| POST | `/rooms/:roomId/collaborators`| Admin | `{ user_id }` | Adiciona um colaborador. |
| DELETE | `/rooms/:roomId/collaborators/:id`| Admin | - | Remove o colaborador da sala. |

### 5. Sensores e Atuadores (`/sensors`)

| Método | Rota | Autenticação | Corpo da Requisição (JSON) | Descrição |
|--------|------|--------------|-----------------------------|-----------|
| GET | `/sensors` | Bearer Token | - | Lista todos os sensores/atuadores. |
| POST | `/sensors` | Admin | `{ room_id, name, device_key, direction ("INPUT"\|"OUTPUT"), type ("RELE"\|"SERVO"\|"PWM"\|"REED_SWITCH"), type_of_control ("DIGITAL"\|"ANALOGICO"), pin (0-39), pin_pwm?, current_state? }` | Cadastra novo sensor/atuador. |
| GET | `/sensors/:id` | Bearer Token | - | Detalhes do sensor. |
| PATCH | `/sensors/:id` | Admin | Propriedades parciais de Sensor | Atualiza cadastro do sensor. |
| DELETE | `/sensors/:id` | Admin | - | Remove o sensor. |
| POST | `/sensors/:id/command` | Admin ou Colaborador | `{ current_state (0-100) }` | Envia comando para o atuador/sensor. |

### 6. Integração ESP32 (Hardware)

Rotas geralmente consumidas diretamente pelo dispositivo de hardware (ESP32).

| Método | Rota | Autenticação | Corpo / Query | Descrição |
|--------|------|--------------|----------------|-----------|
| POST | `/rooms/:id/handshake` | Pública | `{ user_id, room_id, mac_address }` | Handshake inicial do dispositivo. |
| GET | `/rooms/:roomId/commands` | Pública | **Query**: `?mac_address=AA:BB:CC:DD:EE:FF` | Dispositivo busca comandos pendentes. |
| POST | `/sensors/rooms/:roomId/:deviceKey/state`| Pública | `{ mac_address, current_state (0-100) }` | Dispositivo informa mudança no estado de um sensor. |

## Fluxo ESP32 (Resumo Prático)

1. **Ao ligar**, o ESP32 chama `POST /rooms/:id/handshake` com `user_id`, `room_id` e `mac_address`.
2. **Para processar ações**, chama repetidamente `GET /rooms/:roomId/commands?mac_address=AA:BB:CC:DD:EE:FF` para ver se o backend registrou comandos (`POST /sensors/:id/command`).
3. **Para reportar leituras** (ex: sensor de presença ou chave física), chama `POST /sensors/rooms/:roomId/:deviceKey/state`.

## E-mail em desenvolvimento

Se `SMTP_HOST` estiver vazio, o Nodemailer usa transporte JSON e imprime o e-mail no console. Isso permite testar os codigos sem SMTP real.

## Fotos

As fotos são enviadas como `multipart/form-data`, no campo `photo`. São aceitos arquivos JPEG, PNG e WebP de até 5 MB. Os arquivos são armazenados em `UPLOAD_DIR` e disponibilizados pela URL retornada na resposta.

Exemplo com cURL:

```bash
curl -X POST http://localhost:3000/users/me/photo \
	-H "Authorization: Bearer SEU_TOKEN" \
	-F "photo=@perfil.jpg"
```