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
