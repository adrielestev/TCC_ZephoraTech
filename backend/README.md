# Zephora API

API REST do Zephora para autenticação, usuários, salas, aparelhos,
automações e sincronização com ESP32.

## Tecnologias

Node.js 22+ · Express 5 · SQLite (`node:sqlite`) · JWT · Zod.

## Executar localmente

```bash
npm install
cp .env.example .env
npm run db:seed
npm run dev
```

Antes do seed, preencha `OWNER_EMAIL` e `OWNER_PASSWORD` no `.env`.
Também defina `JWT_SECRET` e `CODE_HMAC_SECRET` com valores seguros de pelo
menos 32 caracteres.

Comandos disponíveis:

```bash
npm start       # produção/local sem modo watch
npm run dev     # desenvolvimento com reinício automático
npm test        # testes de API
npm run db:seed # cria ou atualiza o usuário owner
npm run format  # formata o código com Prettier
npm run format:check # verifica a formatação sem alterar arquivos
```

A API inicia em `http://localhost:3333`. O endpoint de verificação é
`GET /health`.

## Variáveis importantes

As opções estão documentadas em [`.env.example`](./.env.example).

- `PORT`: porta da API.
- `DB_PATH`: arquivo SQLite.
- `UPLOAD_DIR`: diretório de fotos e avatares.
- `JWT_SECRET` e `CODE_HMAC_SECRET`: segredos obrigatórios.
- `SMTP_*`: configuração de e-mail; obrigatória em produção.
- `ESP32_POLL_INTERVAL_MS`: intervalo sugerido de sincronização.

## Banco de dados

O schema é aplicado automaticamente na inicialização (`src/database/schema.sql`).
As tabelas são `STRICT` e `room_access` e `automation_devices` usam chave composta.
Ao atualizar de uma versão anterior do schema, apague o arquivo definido em
`DB_PATH` (por padrão `data/zephora.db`) e rode `npm run db:seed` de novo.

O status do ESP32 (`pending`, `online`, `offline`) não é gravado: é calculado a
partir de `last_seen_at` e de `ESP32_OFFLINE_AFTER_SECONDS`.

## Rotas principais

Todas as rotas da aplicação usam o prefixo `/api`.

| Grupo | Uso |
| --- | --- |
| `/api/auth` | cadastro, login, verificação e recuperação de senha |
| `/api/users` | perfil e administração de usuários |
| `/api/rooms` | salas, acessos e fotos |
| `/api/devices` | aparelhos e estados |
| `/api/automations` | regras de automação |
| `/api/esp32` | cadastro e gerenciamento dos módulos |
| `/api/device-sync` | sincronização usada pelo firmware |

O arquivo [`insomnia-export.json`](./insomnia-export.json) pode ser importado
no Insomnia para testar a API.

## Estrutura

```text
src/
  config/       configuração e variáveis de ambiente
  database/     SQLite, schema e seed
  modules/      rotas, controllers, serviços e repositórios
  shared/       autenticação, validação, segurança e utilitários
test/           testes de integração da API
```
