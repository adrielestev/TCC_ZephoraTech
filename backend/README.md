# Zephora Backend

API REST para automação de salas. Requer Node.js 24+, Express, Zod, Knex com o módulo SQLite nativo `node:sqlite`, Nodemailer, JWT e bcrypt. Não é necessário instalar um driver SQLite nativo via npm.

## Inicialização

```powershell
npm install
Copy-Item .env.example .env
npm run db:setup
npm run dev
```

Configure `INITIAL_ADMIN_*` antes de executar o seed. O seed cria apenas a conta inicial se ela ainda não existir. Configure `JWT_SECRET` com pelo menos 32 caracteres em produção. Sem `SMTP_HOST`, os códigos de verificação e de recuperação aparecem no terminal apenas em desenvolvimento; em produção nenhum código é exposto e o envio falha. Para enviar e-mails, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` e `MAIL_FROM`. `PASSWORD_RESET_TTL_MINUTES` define a validade do código de recuperação (padrão: 15 minutos).

## Estrutura do backend

- `src/routes`: declara URLs, middlewares e schemas de cada domínio.
- `src/controllers`: traduz requisições HTTP em chamadas de serviço e monta respostas.
- `src/services`: aplica regras de autenticação, acesso, salas, dispositivos e automações.
- `src/repositories`: concentra consultas e alterações SQLite via Knex.
- `src/schemas`: valida corpos e parâmetros com Zod.
- `src/middlewares`: autenticação, limitação de tentativas, validação e erros.
- `src/config` e `src/serializers`: configuração validada e formatos públicos de resposta.
- `migrations`: uma migration consolidada com o schema SQLite completo e atualizado.
- `seeds`: criação idempotente do admin inicial.

O arquivo `schemadb.dbml` documenta o mesmo schema. Para uma instalação nova, `npm run db:setup` aplica a migration consolidada e executa o seed.

## Fotos e uploads

Fotos de perfil e de salas são enviadas como `multipart/form-data`, usando o campo `photo`. São aceitos apenas JPEG, PNG e WebP, com limite de 5 MB por arquivo e uma imagem por requisição. O backend verifica o tipo declarado e a assinatura binária, gera um nome aleatório e salva o conteúdo em `backend/uploads` com permissões restritas. Essa pasta não é servida como diretório público; o SQLite guarda somente o nome gerado.

Use `POST /api/users/me/photo` para enviar ou substituir a própria foto, `DELETE /api/users/me/photo` para removê-la, e `POST` ou `DELETE /api/rooms/:id/photos/:slot` para gerenciar os espaços de foto 1 a 3 de uma sala (somente admin). As URLs retornadas apontam para `GET /api/media/:filename`, que exige JWT e só permite ao usuário ler a própria foto, a qualquer admin ler fotos existentes, ou a colaboradores ler fotos das salas às quais têm acesso. As respostas de imagem não são armazenadas em cache; clientes web devem enviar o Bearer Token no fetch da URL.

Configuração inválida impede a inicialização. Cadastro, verificação, login e handshake ESP32 têm limites de requisições; tokens de usuário são conferidos contra o banco em cada chamada para aplicar imediatamente mudanças de papel. Segredos de ESP32 são armazenados como SHA-256 e comparados em tempo constante. Respostas de colaborador não incluem MAC, pinos ou configuração interna de dispositivos.

## API

Todas as rotas abaixo usam o prefixo `/api`. JSON é validado com Zod. Rotas autenticadas usam `Authorization: Bearer <token>`.

| Método           | Rota                                       | Acesso                           | Função                                                                      |
| ---------------- | ------------------------------------------ | -------------------------------- | --------------------------------------------------------------------------- |
| POST             | `/auth/register`                           | Público                          | Cadastra e envia código de verificação                                      |
| POST             | `/auth/verify-email`                       | Público                          | Verifica e-mail com `{email, code}`                                         |
| POST             | `/auth/resend-code`                        | Público                          | Solicita novo código de verificação                                         |
| POST             | `/auth/login`                              | Público                          | Autentica e retorna JWT                                                     |
| POST             | `/auth/forgot-password`                    | Público                          | Solicita código temporário de recuperação sem revelar se a conta existe     |
| POST             | `/auth/reset-password`                     | Público                          | Redefine a senha com `{email, code, password}`                              |
| GET              | `/auth/me`                                 | Usuário                          | Perfil autenticado                                                          |
| PATCH            | `/users/me`                                | Usuário                          | Atualiza perfil                                                             |
| POST/DELETE      | `/users/me/photo`                          | Usuário                          | Envia/remove a própria foto (multipart `photo`; JPEG, PNG ou WebP até 5 MB) |
| GET              | `/users`                                   | Admin                            | Lista usuários                                                              |
| PATCH            | `/users/:id/role`                          | Admin                            | Promove/rebaixa via `{user_level: "admin"                                   | "user"}` |
| GET/POST         | `/rooms`                                   | Usuário/Admin                    | Lista salas acessíveis / cria sala (admin)                                  |
| GET/PATCH/DELETE | `/rooms/:id`                               | Colaborador/Admin; escrita admin | Consulta / configura / remove sala                                          |
| POST/DELETE      | `/rooms/:id/photos/:slot`                  | Admin                            | Envia/remove foto da sala no slot 1 a 3                                     |
| GET              | `/media/:filename`                         | Usuário autorizado               | Lê foto de perfil própria ou foto de sala acessível                         |
| GET/POST         | `/rooms/:id/collaborators`                 | Admin                            | Lista/adiciona `{user_id}` como colaborador                                 |
| DELETE           | `/rooms/:id/collaborators/:collaboratorId` | Admin                            | Remove vínculo de colaborador                                               |
| POST             | `/rooms/:id/device-credential`             | Admin                            | Gera/rotaciona segredo único do ESP32                                       |
| GET/POST         | `/rooms/:id/devices`                       | Colaborador/Admin; escrita admin | Lista/cadastra dispositivos                                                 |
| PATCH/DELETE     | `/devices/:id`                             | Admin                            | Configura/remove dispositivo                                                |
| POST             | `/devices/:id/command`                     | Colaborador/Admin                | Define `{value}` do dispositivo de saída                                    |
| GET/POST         | `/rooms/:id/automations`                   | Colaborador/Admin da sala        | Lista/cria regras de automação para a sala                                  |
| PATCH/DELETE     | `/automations/:id`                         | Admin                            | Altera/remove uma regra                                                     |
| POST             | `/device/handshake`                        | ESP32                            | Troca MAC + segredo nos headers por JWT de dispositivo                      |
| GET              | `/device/commands`                         | ESP32                            | Busca configuração e estados dos dispositivos da sala                       |
| POST             | `/device/devices/:id/state`                | ESP32                            | Reporta `{value}` do dispositivo                                            |

`sensors` no banco representa tanto sensores quanto atuadores. Cada sala aceita um ESP32; credenciais são armazenadas com SHA-256 e o segredo é mostrado uma única vez. O ESP32 envia `X-Device-MAC` e `X-Device-Credential` no handshake. Rotacionar o segredo invalida os tokens existentes. O colaborador pode comandar saídas das salas vinculadas, sem permissão de configuração ou acesso a outras salas.

As regras disparam quando o ESP32 reporta uma leitura de entrada. `cooldown_seconds` limita a repetição durante a execução do backend para regras que mantêm o último valor. Com `restore_previous: true`, a automação salva o estado desejado da saída ao iniciar a condição, bloqueia comandos manuais enquanto estiver ativa e restaura o valor salvo quando a condição termina. O bloqueio aparece em `automation_lock` na resposta do dispositivo e comandos manuais recebem HTTP 423. Pausar ou excluir uma regra ativa libera o controle sem alterar o estado atual. Regras existentes mantêm o comportamento anterior (`restore_previous: false`).

## HTTP e HTTPS

O servidor escuta na porta `PORT` (padrão 3000), em `0.0.0.0`. Pode atender HTTPS diretamente quando `HTTPS_KEY_FILE` e `HTTPS_CERT_FILE` apontarem para a chave e o certificado TLS; em produção também pode ficar atrás de um proxy HTTPS. Configure as origens web em `CORS_ORIGIN`.

## Importar no Insomnia

Importe `insomnia/zephora-api-insomnia.json` pelo menu **Import** do Insomnia. Em **Base Environment**, ajuste `base_url` se necessário. Faça login e copie o JWT de usuário para `token`; gere a credencial do ESP32 e copie-a para `device_credential`; depois do handshake, copie o JWT de dispositivo para `device_token`. Para os uploads de foto, selecione um arquivo JPEG, PNG ou WebP no campo multipart `photo`; o slot da foto da sala vem da variável `photo_slot` (1 a 3). Em desenvolvimento, o código de verificação aparece no terminal do backend se SMTP não estiver configurado. Atualize os IDs do ambiente conforme as respostas da API antes de executar as requisições dependentes.
