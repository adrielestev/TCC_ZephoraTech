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

`npm install` instala as dependências sem executar operações no banco. Para criar
as tabelas e carregar os dados iniciais, rode as migrações e seeds explicitamente
como acima (ou use `npm run db:setup`). O `package.json` autoriza o script de
instalação do `sqlite3@6.0.1`, necessário para compilar/baixar o binário nativo.
Se você já instalou as dependências antes dessa autorização e o SQLite falhar com
`Could not locate the bindings file`, rode:

```powershell
npm rebuild sqlite3
npm run db:setup
```

## Publicar no Azure App Service

O perfil de nuvem usa **App Service Linux com runtime Node 24**, implantando o
conteúdo desta pasta (`backend`) como raiz do aplicativo. O App Service fornece a
porta em `PORT`; o servidor já escuta nessa porta e em `0.0.0.0`. Ative a
automação de build no deploy com `SCM_DO_BUILD_DURING_DEPLOYMENT=true` para que o
Azure instale as dependências no Linux e prepare o binário do SQLite para esse
ambiente.

Configure estas variáveis em **App Service > Settings > Environment variables**
(não publique segredos no repositório):

| Nome | Valor |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `/home/data/zephora.sqlite` |
| `UPLOAD_DIR` | `/home/uploads` |
| `APP_URL` | `https://<nome-do-app>.azurewebsites.net` |
| `JWT_SECRET` | Segredo aleatório exclusivo, com pelo menos 32 caracteres |
| `INITIAL_ADMIN_NAME` | Nome do administrador inicial |
| `INITIAL_ADMIN_EMAIL` | E-mail exclusivo do administrador inicial |
| `INITIAL_ADMIN_PASSWORD` | Senha exclusiva com pelo menos 12 caracteres |

Defina também `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` e
`MAIL_FROM` se o backend precisar enviar e-mails. O modo sem SMTP continua
disponível para demonstração.

Em **Configuration > General settings**, selecione Node 24 e use o plano Linux
com runtime gerenciado do App Service, sem container personalizado. Depois do
primeiro deploy, abra **SSH** no portal, entre em `/home/site/wwwroot` e execute
`npm run db:setup` uma vez para aplicar as migrações e criar o administrador
inicial. Não execute seeds de desenvolvimento a cada inicialização. O `start` do
`package.json` inicia a API.

O aplicativo valida em produção que `DATABASE_URL` e `UPLOAD_DIR` estejam dentro
de `/home`; assim, um caminho relativo acidental não grava o banco no diretório
de publicação. O SQLite foi mantido. Para esse uso, mantenha **uma instância** do
App Service, sem scale-out ou múltiplos processos Node, e não monte uma unidade
Azure Files para o banco. Faça backups do arquivo `zephora.sqlite` e do conteúdo
de `/home/uploads`. O armazenamento persistente do App Service mantém `/home`
entre reinicializações; montagens Azure Files são inadequadas para arquivos de
banco SQLite que dependem de bloqueios.

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

| Método | Rota                    | Autenticação | Corpo da Requisição (JSON)                                 | Descrição                                                                          |
| ------ | ----------------------- | ------------ | ---------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| POST   | `/auth/register`        | Pública      | `{ name (min: 2), email, password (min: 8), user_photo? }` | Aceita o pedido e envia instruções quando aplicável (HTTP 202; resposta genérica). |
| POST   | `/auth/verify-email`    | Pública      | `{ email, code (6 dígitos) }`                              | Verifica o email do usuário.                                                       |
| POST   | `/auth/resend-code`     | Pública      | `{ email }`                                                | Reenvia o código de verificação.                                                   |
| POST   | `/auth/login`           | Pública      | `{ email, password }`                                      | Retorna o token JWT e dados do usuário.                                            |
| POST   | `/auth/forgot-password` | Pública      | `{ email }`                                                | Solicita reset de senha.                                                           |
| POST   | `/auth/reset-password`  | Pública      | `{ email, code, password }`                                | Define uma nova senha usando o código.                                             |
| GET    | `/auth/me`              | Bearer Token | -                                                          | Retorna os dados do usuário autenticado.                                           |

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

| Método | Rota                           | Autenticação           | Corpo da Requisição (JSON)                                                           | Descrição                                                                                                                                                                       |
| ------ | ------------------------------ | ---------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/rooms`                       | Bearer Token           | -                                                                                    | Lista as salas disponíveis.                                                                                                                                                     |
| POST   | `/rooms`                       | Admin                  | `{ name, classroom_code, mac_address, room_photo_1?, room_photo_2?, room_photo_3? }` | Cria uma nova sala.                                                                                                                                                             |
| GET    | `/rooms/:id`                   | Bearer Token           | -                                                                                    | Detalhes de uma sala.                                                                                                                                                           |
| PATCH  | `/rooms/:id`                   | Admin                  | Propriedades parciais de Room (ex: `name`)                                           | Atualiza dados da sala.                                                                                                                                                         |
| POST   | `/rooms/:id/device-credential` | Admin com Bearer Token | -                                                                                    | Gera/rotaciona a credencial do ESP32; o segredo é retornado uma única vez. Para admins, `GET /rooms` e `GET /rooms/:id` expõem `has_device_credential` (boolean), nunca o hash. |
| POST   | `/rooms/:id/photos/:slot`      | Admin                  | `FormData: { photo: arquivo }` (Slot: 1, 2, ou 3)                                    | Atualiza foto no slot.                                                                                                                                                          |
| DELETE | `/rooms/:id/photos/:slot`      | Admin                  | -                                                                                    | Remove a foto do slot.                                                                                                                                                          |
| DELETE | `/rooms/:id`                   | Admin                  | -                                                                                    | Exclui a sala.                                                                                                                                                                  |

### 4. Colaboradores (`/rooms/:roomId/collaborators`)

| Método | Rota                               | Autenticação | Corpo da Requisição (JSON) | Descrição                     |
| ------ | ---------------------------------- | ------------ | -------------------------- | ----------------------------- |
| GET    | `/rooms/:roomId/collaborators`     | Admin        | -                          | Lista colaboradores da sala.  |
| POST   | `/rooms/:roomId/collaborators`     | Admin        | `{ user_id }`              | Adiciona um colaborador.      |
| DELETE | `/rooms/:roomId/collaborators/:id` | Admin        | -                          | Remove o colaborador da sala. |

### 5. Sensores e Atuadores (`/sensors`)

| Método | Rota                   | Autenticação         | Corpo da Requisição (JSON)                                                                                              | Descrição                                                     |
| ------ | ---------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| GET    | `/sensors`             | Bearer Token         | -                                                                                                                       | Lista todos os sensores/atuadores.                            |
| POST   | `/sensors`             | Admin                | `{ room_id, name, device_key, direction, type, type_of_control, pin, current_state?, device_settings?, state_labels? }` | Cadastra dispositivo e configurações específicas do seu tipo. |
| GET    | `/sensors/:id`         | Bearer Token         | -                                                                                                                       | Detalhes do sensor.                                           |
| PATCH  | `/sensors/:id`         | Admin                | Propriedades parciais de Sensor                                                                                         | Atualiza cadastro do sensor.                                  |
| DELETE | `/sensors/:id`         | Admin                | -                                                                                                                       | Remove o sensor.                                              |
| POST   | `/sensors/:id/command` | Admin ou Colaborador | `{ current_state } (digital: 0 ou 1; analógico: 0 a 100)`                                                               | Envia comando para o atuador/sensor.                          |

### 6. Integração ESP32 (Hardware)

Rotas geralmente consumidas diretamente pelo dispositivo de hardware (ESP32).

| Método | Rota                               | Autenticação                 | Corpo / Query                                                                        | Descrição                                                                                  |
| ------ | ---------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| POST   | `/device/handshake`                | MAC + credencial nos headers | -                                                                                    | Handshake; a sala é resolvida pelo MAC. Devolve JWT e sensores.                            |
| GET    | `/device/commands`                 | Bearer do dispositivo (JWT)  | -                                                                                    | Estados desejados das saídas e configurações atualizadas de todos os dispositivos da sala. |
| POST   | `/device/sensors/:deviceKey/state` | Bearer do dispositivo (JWT)  | `{ current_state } (digital: 0 ou 1; analógico: 0 a 100; temperatura: -40 a 125 °C)` | Dispositivo reporta estado do sensor/atuador.                                              |

## Fluxo ESP32 (Resumo Prático)

1. Um administrador chama `POST /rooms/:id/device-credential` com Bearer Token e injeta o segredo retornado no ESP32. O segredo é aleatório, único por sala, armazenado somente como hash e exibido apenas nessa resposta; chame novamente para revogá-lo e gerar outro.
2. **Ao ligar**, o ESP32 chama `POST /device/handshake` com `X-Device-MAC` e `X-Device-Credential`. Não envia id de sala: o backend encontra a sala pelo MAC. Use HTTPS e nunca envie o segredo em URL/query string. A resposta inclui `token` (JWT de sessão, 7 dias) e a lista de sensores.
3. **Para processar ações**, consulta `GET /device/commands` com `Authorization: Bearer <token>`.
4. **Para reportar estado**, chama `POST /device/sensors/:deviceKey/state` com o mesmo Bearer e `{ "current_state": 0 }`. A autenticação é pela sala do token; a rota permite reportar tanto sensores INPUT quanto OUTPUT.
5. Se o JWT expirar ou for recusado (HTTP 401), o firmware descarta o token e refaz o handshake.

Salas existentes ficam sem credencial após a migração e não podem usar rotas ESP32 até um administrador gerar a credencial. Rotacionar a credencial ou alterar o MAC invalida o JWT de dispositivo imediatamente; a credencial anterior também deixa de autenticar o handshake.

## Contrato de tipos e valores para o firmware

`current_state` é o valor persistido pela API e usado pelo app e pelo ESP32. O formato depende do tipo do dispositivo. `device_settings` guarda parâmetros de hardware/controle individuais; cada tipo aceita apenas as opções documentadas abaixo. Omitir o campo aplica os padrões indicados:

| Tipo                                          | Direção | Valores de `current_state`         | Conversão no firmware                                                                                                                                                                    |
| --------------------------------------------- | ------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RELE`                                        | OUTPUT  | `0` ou `1`                         | `0` desliga e `1` liga a saída digital. A inversão de módulos ativos em nível baixo deve ser definida na configuração elétrica/firmware.                                                 |
| `SERVO`                                       | OUTPUT  | `0` a `100`                        | Percentual normalizado: converter para o ângulo calibrado do servo: `min_angle + state / 100 * (max_angle - min_angle)`. Os limites devem ser configurados para o modelo de servo usado. |
| `PWM`                                         | OUTPUT  | `0` a `100`                        | Percentual de duty cycle: `duty = state / 100`. O firmware converte para a resolução e frequência PWM configuradas para a placa e carga.                                                 |
| `REED_SWITCH`, `CONTACT_SENSOR`, `PIR_SENSOR` | INPUT   | `0` ou `1`                         | `0` representa inativo/aberto/sem detecção; `1` representa ativo/fechado/detecção, conforme o sensor e a configuração elétrica.                                                          |
| `TEMPERATURE`                                 | INPUT   | `-40` a `125` °C (aceita decimais) | Reporte a temperatura em graus Celsius, por exemplo `23.5`. O app exibe uma casa decimal e a unidade `°C`.                                                                               |

Configurações aceitas em `device_settings`:

| Tipo                                      | Campos                                                                   | Padrões / limites                                               |
| ----------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `RELE`                                    | `inverted`                                                               | `false`                                                         |
| `PWM`                                     | `min_percent`, `max_percent`, `step_percent`, `frequency_hz`, `inverted` | `0`, `100`, `5`, `5000 Hz`, `false`; frequência de 1 a 40000 Hz |
| `SERVO`                                   | `min_percent`, `max_percent`, `step_percent`, `min_angle`, `max_angle`   | `0`, `100`, `5`, `0°`, `180°`                                   |
| Entradas `REED_SWITCH` e `CONTACT_SENSOR` | `inverted`, `debounce_ms`                                                | `false`, `50 ms`                                                |
| `PIR_SENSOR`                              | `inverted`, `debounce_ms`, `hold_ms`                                     | `false`, `50 ms`, `0 ms`                                        |
| `TEMPERATURE`                             | Nenhuma                                                                  | Leitura em °C, de −40 a 125, com casas decimais.                |

As faixas percentuais são limitadas a 0–100; o mínimo deve ser menor ou igual ao máximo. O estado `0` continua disponível como valor de desligado mesmo quando o mínimo configurado é maior que zero. `step_percent` configura os incrementos sugeridos no controle do app. `min_angle` e `max_angle` aceitam valores inteiros entre 0° e 180°, com mínimo menor que máximo. `debounce_ms` aceita 0–5000 e `hold_ms`, 0–3600000. Esses parâmetros são enviados no handshake e novamente em `GET /device/commands` (campo `devices`), permitindo que o ESP32 atualize configurações sem reiniciar.

O ESP32 deve enviar leituras INPUT e estados aplicados de OUTPUT no mesmo formato. Assim, um comando para relé usa `{ "current_state": 1 }`; um comando analógico usa um percentual, como `{ "current_state": 65 }`; e um sensor de temperatura reporta graus Celsius, como `{ "current_state": 23.5 }`. Leituras digitais diferentes de `0` ou `1` são rejeitadas. O mesmo campo `pin` identifica o GPIO escolhido para relé, PWM, servo ou entrada digital; o suporte e a capacidade PWM devem ser conferidos no modelo exato da placa. `device_settings` fornece frequência PWM e calibração do servo por dispositivo. Em registros legados PWM, o valor antigo de `pin_pwm` é tratado como o único pino PWM e será consolidado em `pin` ao salvar o dispositivo.

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
