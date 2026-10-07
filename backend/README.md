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

O acesso do navegador é habilitado com a configuração padrão do middleware CORS.
`APP_URL` é a URL pública da API, usada nos links de mídia assinados.

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

Em `NODE_ENV=production`, a API rejeita a configuração se `JWT_SECRET` não tiver
ao menos 32 caracteres, se a senha inicial do administrador continuar no valor
padrão ou tiver menos de 12 caracteres, ou se `APP_URL` não usar HTTPS. Os
valores padrão do `.env.example` são apenas para desenvolvimento.

## Exposição e autorização de dados

- Rotas de usuário, sala e sensor autenticam com Bearer Token; operações de
	cadastro/administração exigem papel ADMIN e leitura de salas/sensores é
	filtrada pela associação do colaborador.
- Respostas a colaboradores omitem o MAC das salas e os identificadores/pinos
	internos dos sensores. Administradores mantêm acesso às configurações.
- O hash da credencial ESP32, hashes de senha e de verificação, campos de
	controle de verificação e `deleted_at` não são retornados pelas rotas comuns.
- Fotos de perfil e sala usam URLs assinadas com validade de uma hora. Solicite
	novamente os dados autenticados para obter outra URL após a expiração.
- Mensagens públicas de cadastro, login, reenvio e recuperação não confirmam
	se um endereço de e-mail existe. Detalhes de erros internos ficam somente no
	log do servidor.

## Referência da API

Abaixo está a documentação completa dos endpoints, útil para integração do frontend/mobile e entendimento sem necessidade de analisar o código-fonte.

**Regras Gerais:**

- Rotas autenticadas exigem o cabeçalho `Authorization: Bearer <TOKEN>`.
- O prefixo da API base depende do ambiente (ex: `http://localhost:3000`).

### 1. Autenticação (`/auth`)

| Método | Rota                    | Autenticação | Corpo da Requisição (JSON)                                 | Descrição                                |
| ------ | ----------------------- | ------------ | ---------------------------------------------------------- | ---------------------------------------- |
| POST   | `/auth/register`        | Pública      | `{ name (min: 2), email, password (min: 8), user_photo? }` | Aceita o pedido e envia instruções quando aplicável (HTTP 202; resposta genérica). |
| POST   | `/auth/verify-email`    | Pública      | `{ email, code (6 dígitos) }`                              | Verifica o email do usuário.             |
| POST   | `/auth/resend-code`     | Pública      | `{ email }`                                                | Reenvia o código de verificação.         |
| POST   | `/auth/login`           | Pública      | `{ email, password }`                                      | Retorna o token JWT e dados do usuário.  |
| POST   | `/auth/forgot-password` | Pública      | `{ email }`                                                | Solicita reset de senha.                 |
| POST   | `/auth/reset-password`  | Pública      | `{ email, code, password }`                                | Define uma nova senha usando o código.   |
| GET    | `/auth/me`              | Bearer Token | -                                                          | Retorna os dados do usuário autenticado. |

### 2. Usuários (`/users`)

| Método | Rota               | Autenticação | Corpo da Requisição (JSON) / FormData | Descrição                            |
| ------ | ------------------ | ------------ | ------------------------------------- | ------------------------------------ |
| PATCH  | `/users/me`        | Bearer Token | `{ name?, user_photo? }`              | Atualiza o próprio perfil.           |
| POST   | `/users/me/photo`  | Bearer Token | `FormData: { photo: arquivo }`        | Atualiza/Adiciona a foto de perfil.  |
| DELETE | `/users/me/photo`  | Bearer Token | -                                     | Remove a foto de perfil.             |
| GET    | `/users`           | Admin        | -                                     | Lista todos os usuários.             |
| PATCH  | `/users/:id/level` | Admin        | `{ user_level: "USER" \| "ADMIN" }`   | Altera o nível de acesso do usuário. |
| DELETE | `/users/:id`       | Admin        | -                                     | Soft delete de um usuário.           |

### 3. Salas (`/rooms`)

| Método | Rota                      | Autenticação | Corpo da Requisição (JSON)                                                           | Descrição                   |
| ------ | ------------------------- | ------------ | ------------------------------------------------------------------------------------ | --------------------------- |
| GET    | `/rooms`                  | Bearer Token | -                                                                                    | Lista as salas disponíveis. |
| POST   | `/rooms`                  | Admin        | `{ name, classroom_code, mac_address, room_photo_1?, room_photo_2?, room_photo_3? }` | Cria uma nova sala.         |
| GET    | `/rooms/:id`              | Bearer Token | -                                                                                    | Detalhes de uma sala.       |
| PATCH  | `/rooms/:id`              | Admin        | Propriedades parciais de Room (ex: `name`)                                           | Atualiza dados da sala.     |
| POST   | `/rooms/:id/device-credential` | Admin com Bearer Token | - | Gera/rotaciona a credencial do ESP32; o segredo é retornado uma única vez. Para admins, `GET /rooms` e `GET /rooms/:id` expõem `has_device_credential` (boolean), nunca o hash. |
| POST   | `/rooms/:id/photos/:slot` | Admin        | `FormData: { photo: arquivo }` (Slot: 1, 2, ou 3)                                    | Atualiza foto no slot.      |
| DELETE | `/rooms/:id/photos/:slot` | Admin        | -                                                                                    | Remove a foto do slot.      |
| DELETE | `/rooms/:id`              | Admin        | -                                                                                    | Exclui a sala.              |

### 4. Colaboradores (`/rooms/:roomId/collaborators`)

| Método | Rota                               | Autenticação | Corpo da Requisição (JSON) | Descrição                     |
| ------ | ---------------------------------- | ------------ | -------------------------- | ----------------------------- |
| GET    | `/rooms/:roomId/collaborators`     | Admin        | -                          | Lista colaboradores da sala.  |
| POST   | `/rooms/:roomId/collaborators`     | Admin        | `{ user_id }`              | Adiciona um colaborador.      |
| DELETE | `/rooms/:roomId/collaborators/:id` | Admin        | -                          | Remove o colaborador da sala. |

### 5. Sensores e Atuadores (`/sensors`)

| Método | Rota                   | Autenticação         | Corpo da Requisição (JSON)                                                                                                                                                                   | Descrição                            |
| ------ | ---------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| GET    | `/sensors`             | Bearer Token         | -                                                                                                                                                                                            | Lista todos os sensores/atuadores.   |
| POST   | `/sensors`             | Admin                | `{ room_id, name, device_key, direction ("INPUT"\|"OUTPUT"), type ("RELE"\|"SERVO"\|"PWM"\|"REED_SWITCH"), type_of_control ("DIGITAL"\|"ANALOGICO"), pin (0-39), pin_pwm?, current_state? }` | Cadastra novo sensor/atuador.        |
| GET    | `/sensors/:id`         | Bearer Token         | -                                                                                                                                                                                            | Detalhes do sensor.                  |
| PATCH  | `/sensors/:id`         | Admin                | Propriedades parciais de Sensor                                                                                                                                                              | Atualiza cadastro do sensor.         |
| DELETE | `/sensors/:id`         | Admin                | -                                                                                                                                                                                            | Remove o sensor.                     |
| POST   | `/sensors/:id/command` | Admin ou Colaborador | `{ current_state (0-100) }`                                                                                                                                                                  | Envia comando para o atuador/sensor. |

### 6. Integração ESP32 (Hardware)

Rotas geralmente consumidas diretamente pelo dispositivo de hardware (ESP32).

| Método | Rota                                      | Autenticação | Corpo / Query                    | Descrição                                           |
| ------ | ----------------------------------------- | ------------ | -------------------------------- | --------------------------------------------------- |
| POST   | `/rooms/:id/handshake`                    | MAC + credencial nos headers | - | Handshake inicial e configuração dos sensores. |
| GET    | `/rooms/:roomId/commands`                 | MAC + credencial nos headers | - | Dispositivo busca comandos pendentes. |
| POST   | `/sensors/rooms/:roomId/:deviceKey/state` | MAC + credencial nos headers | `{ current_state (0-100) }` | Dispositivo reporta estado do sensor/atuador. |

## Fluxo ESP32 (Resumo Prático)

1. Um administrador chama `POST /rooms/:id/device-credential` com Bearer Token e injeta o segredo retornado no ESP32. O segredo é aleatório, único por sala, armazenado somente como hash e exibido apenas nessa resposta; chame novamente para revogá-lo e gerar outro.
2. Em cada requisição do ESP32, envie `X-Device-MAC: AA:BB:CC:DD:EE:FF` e `X-Device-Credential: <segredo>` nos headers. Use HTTPS e nunca envie o segredo em URL/query string.
3. **Ao ligar**, o ESP32 chama `POST /rooms/:id/handshake` sem body.
4. **Para processar ações**, consulta `GET /rooms/:roomId/commands` periodicamente.
5. **Para reportar estado**, chama `POST /sensors/rooms/:roomId/:deviceKey/state` com `{ "current_state": 0 }`. A autenticação é por sala; a rota permite reportar tanto sensores INPUT quanto OUTPUT.

Salas existentes ficam sem credencial após a migração e não podem usar rotas ESP32 até um administrador gerar a credencial. Rotacionar a credencial invalida imediatamente a anterior.

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
