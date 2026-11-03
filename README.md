# Zephora Tech

> Plataforma de automação inteligente de salas com aplicativo multiplataforma, API REST e controlador ESP32.

[![Backend](https://img.shields.io/badge/backend-Node.js%2024%2B-339933?logo=node.js&logoColor=white)](./backend)
[![Mobile](https://img.shields.io/badge/mobile-Expo%20%2F%20React%20Native-000020?logo=expo&logoColor=white)](./mobile)
[![Hardware](https://img.shields.io/badge/hardware-ESP32-E7352C?logo=arduino&logoColor=white)](./esp32)
[![Database](https://img.shields.io/badge/database-SQLite-003B57?logo=sqlite&logoColor=white)](./backend/schemaDB.dbml)

## Sobre o projeto

O Zephora Tech centraliza o monitoramento e a automação de ambientes em uma única solução. Usuários administram salas, dispositivos e regras de automação pelo aplicativo, enquanto controladores ESP32 fazem a ponte entre a API e o hardware físico.

O projeto foi desenvolvido como um TCC e organiza a solução em três partes integradas:

| Módulo | Responsabilidade | Tecnologias principais |
| --- | --- | --- |
| [`mobile/`](./mobile) | Aplicativo Android, iOS e web | Expo, React Native, TypeScript |
| [`backend/`](./backend) | Autenticação, regras de negócio e API | Node.js, Express, Zod, Knex, SQLite |
| [`esp32/`](./esp32) | Leitura de sensores e acionamento de saídas | ESP32, Arduino, C++ |

## O que a plataforma oferece

- **Acesso seguro:** cadastro, verificação de e-mail, login, recuperação de senha e controle por níveis de usuário.
- **Gestão de salas:** cadastro, identificação do controlador, fotos e colaboradores autorizados.
- **Controle de dispositivos:** configuração de entradas e saídas, estado atual, estado desejado e comandos manuais.
- **Automação por regras:** associação de um sensor de entrada a uma saída com operadores de comparação, valor-alvo, cooldown e restauração do estado anterior.
- **Integração com ESP32:** handshake autenticado, sincronização de comandos e envio de estados dos sensores.
- **Imagens protegidas:** fotos de usuários e salas com upload validado e acesso condicionado à autorização.
- **Execução flexível:** desenvolvimento local, simulação no Wokwi, placa física e implantação da API no Azure App Service.

## Arquitetura

```text
┌─────────────────────┐       HTTPS/JSON        ┌─────────────────────┐
│  App Zephora        │ ◄─────────────────────► │  API REST           │
│  Android / iOS / Web│                         │  Express + SQLite   │
└─────────────────────┘                         └──────────┬──────────┘
                                                          │
                                             Wi-Fi + JWT  │
                                                          ▼
                                               ┌──────────────────┐
                                               │ ESP32 DevKit     │
                                               │ PIR + relés      │
                                               └──────────────────┘
```

O backend valida as requisições, aplica as permissões e persiste os dados. O ESP32 realiza um handshake com a credencial da sala, recebe a configuração dos dispositivos e consulta comandos pendentes. Eventos de sensores são enviados à API, que avalia as regras e define o próximo estado das saídas.

## Pré-requisitos

- Node.js **24 ou superior**
- npm
- Expo CLI via `npx` para executar o aplicativo
- Arduino CLI e core ESP32 3.x, apenas para o firmware
- Conta ou dispositivo compatível com Expo Go, Android Studio, Xcode ou navegador, conforme o alvo

## Instalação e execução

### 1. Backend

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Edite o `.env`, principalmente `JWT_SECRET` e os dados do administrador inicial. Em seguida, crie o banco e inicie a API:

```powershell
npm run db:setup
npm run dev
```

A API ficará disponível em `http://localhost:3000`. O endpoint `GET /health` retorna o status do serviço.

### 2. Aplicativo

Em outro terminal:

```powershell
cd mobile
npm install
Copy-Item .env.example .env
npm start
```

Para testar no navegador:

```powershell
npm run start:web
```

Em um aparelho físico, defina `EXPO_PUBLIC_API_URL` com o endereço de rede do computador, por exemplo:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.0.10:3000
```

### 3. Firmware

O firmware pode ser simulado no Wokwi ou gravado em uma ESP32 DevKit. O fluxo recomendado é:

1. Iniciar o backend e o aplicativo.
2. Criar uma sala e gerar a credencial do controlador.
3. Cadastrar o MAC do ESP32 e os dispositivos da sala.
4. Configurar a credencial no firmware.
5. Compilar, simular ou gravar o sketch.

As instruções de Arduino IDE, Wokwi, TLS, GPIOs e ligação elétrica estão no [README do ESP32](./esp32/README.md).

## Configuração essencial

| Variável | Onde | Finalidade |
| --- | --- | --- |
| `JWT_SECRET` | `backend/.env` | Assinatura dos tokens da aplicação |
| `DATABASE_URL` | `backend/.env` | Caminho do banco SQLite |
| `INITIAL_ADMIN_*` | `backend/.env` | Dados do administrador criado no seed |
| `SMTP_*` | `backend/.env` | Envio de códigos por e-mail |
| `EXPO_PUBLIC_API_URL` | `mobile/.env` | URL da API consumida pelo app |

Use os arquivos [`backend/.env.example`](./backend/.env.example) e [`mobile/.env.example`](./mobile/.env.example) como base. Nunca versione senhas, tokens, credenciais de dispositivos, `config.h` ou `tls_config.h`.

## Comandos úteis

### Backend

| Comando | Resultado |
| --- | --- |
| `npm run dev` | Executa a API com reinício automático |
| `npm start` | Executa a API em modo normal |
| `npm run db:setup` | Aplica migrations e executa o seed inicial |
| `npm run migrate` | Aplica migrations pendentes |
| `npm run rollback` | Reverte a última migration |
| `npm run start:azure` | Prepara o banco e inicia no Azure App Service |

### Mobile

| Comando | Resultado |
| --- | --- |
| `npm start` | Abre o servidor Expo |
| `npm run start:web` | Executa a versão web |
| `npm run build:web` | Gera a exportação web em `dist/` |
| `npm run lint` | Executa o lint do aplicativo |
| `npx tsc --noEmit` | Verifica os tipos TypeScript |

## Organização do código

```text
TCC_ZephoraTech/
├── backend/
│   ├── migrations/       # Evolução do schema SQLite
│   ├── seeds/            # Dados iniciais
│   └── src/
│       ├── controllers/  # Entrada HTTP
│       ├── domain/       # Catálogo de drivers
│       ├── middlewares/  # Auth, validação, uploads e erros
│       ├── repositories/ # Persistência
│       ├── routes/       # Endpoints
│       └── services/     # Regras de negócio
├── mobile/
│   ├── assets/           # Imagens e ícones PNG
│   └── src/
│       ├── api/          # Cliente HTTP
│       ├── app/          # Rotas Expo Router
│       ├── components/   # Componentes reutilizáveis
│       └── features/     # Funcionalidades por domínio
└── esp32/
    └── ZephoraESP32/    # Sketch, drivers e configuração do hardware
```

## Documentação por módulo

- [Backend e API](./backend/README.md)
- [Aplicativo mobile](./mobile/README.md)
- [Firmware ESP32](./esp32/README.md)
- [Modelo do banco de dados](./backend/schemaDB.dbml)

## Segurança e operação

O backend utiliza Helmet, CORS configurável, limitação de requisições, validação com Zod, JWT e armazenamento de senhas com hash. Credenciais de ESP32 são armazenadas como hash e as imagens não ficam expostas como arquivos públicos.

Em produção:

- substitua todos os valores padrão do `.env`;
- use HTTPS e configure a autoridade certificadora no ESP32;
- restrinja `CORS_ORIGIN` aos domínios necessários;
- mantenha credenciais de dispositivos fora do controle de versão;
- faça backup do banco SQLite e da pasta de uploads.

## Licença

Projeto acadêmico desenvolvido para o TCC Zephora Tech.
