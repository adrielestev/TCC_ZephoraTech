# Zephora Mobile

Aplicativo mobile da plataforma Zephora para gerenciamento e monitoramento de salas automatizadas integradas a dispositivos ESP32.

## Objetivo

O aplicativo permitirá que usuários autenticados interajam com o ecossistema Zephora através de dispositivos móveis, oferecendo funcionalidades como:

- Autenticação e gerenciamento de conta;
- Visualização e controle de salas;
- Monitoramento de sensores;
- Controle de atuadores;
- Gerenciamento de colaboradores;
- Acompanhamento do status dos dispositivos vinculados às salas.

## Executar

Instale as dependências com `npm install` e copie `.env.example` para `.env.local`.
Configure `EXPO_PUBLIC_API_URL` com o endereço acessível do backend:

- Navegador no mesmo computador: `http://localhost:3000`.
- Emulador/dispositivo físico: use o IP da máquina na rede local (por exemplo, `http://192.168.1.10:3000`) ou o domínio do backend.
- Produção: use uma URL HTTPS; o navegador bloqueia chamadas HTTP quando o site é servido por HTTPS.

Comandos disponíveis: `npm start` (Expo), `npm run start:web` (web), `npm run build:web` (exportação web), `npm run lint` e `npx tsc --noEmit`.

A exportação web gera uma SPA. Em hospedagem estática, configure o servidor para servir `index.html` como fallback para rotas desconhecidas, para que URLs de salas com ID também funcionem ao abrir/recarregar diretamente. As imagens enviadas pelo backend também devem usar uma URL alcançável pelo navegador e pelo dispositivo.

Na web, o token de sessão é persistido em `localStorage`; em Android/iOS, é armazenado com Expo SecureStore.
