# Zephora App

Aplicativo do Zephora para Android, iOS e web, desenvolvido com Expo,
React Native, Expo Router e TypeScript.

## Funcionalidades

- autenticação e recuperação de acesso;
- gerenciamento de salas, aparelhos e automações;
- controle de dispositivos e acompanhamento de estados;
- administração de usuários e módulos ESP32;
- execução em celular, tablet e navegador.

## Executar localmente

```bash
npm install
cp .env.example .env
npm start
```

Comandos úteis:

```bash
npm run web        # navegador
npm run android    # Android
npm run ios        # iOS
npm run typecheck  # checagem de tipos
npm run build:web  # build web em dist/
```

Para executar no celular físico, use o mesmo Wi-Fi do computador e informe
no `.env` o endereço acessível da API:

```env
EXPO_PUBLIC_API_URL=http://IP-DO-COMPUTADOR:3333
```

## Organização do código

```text
src/
  app/        rotas do Expo Router
  core/       API, autenticação, armazenamento e navegação
  features/   funcionalidades por domínio
  ui/         componentes e tema visual
```

As chamadas HTTP ficam nas features e usam a API iniciada em
[`../backend/`](../backend). Para a web funcionar, a origem do aplicativo
também deve estar autorizada no ambiente da API.
