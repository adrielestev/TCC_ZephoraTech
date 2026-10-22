# Zephora Mobile

Aplicativo nativo para Android e iOS, com versão web responsiva. O projeto usa Expo SDK 57, React Native, Expo Router e Axios e consome a API em `../backend`.

## Executar

Use Node.js 24 e instale as dependências:

```bash
npm ci
npm start
```

Para iniciar diretamente no navegador:

```bash
npm run start:web
```

Por padrão, o endereço da API é detectado como `http://<host-do-app>:3000`. Para outro ambiente, defina `EXPO_PUBLIC_API_URL` no arquivo `.env`, por exemplo:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.0.10:3000
```

Use o endereço de rede do computador ao testar em um telefone físico. Em produção, a API deve estar em HTTPS.

## Funcionalidades

- Cadastro, verificação de e-mail, login e perfil com foto.
- Salas com fotos, configuração do ESP32 e credencial de dispositivo.
- Configuração de dispositivos de entrada e saída, monitoramento e comandos.
- Administração para promover usuários e gerenciar colaboradores de cada sala.
- Navegação adaptada a telas móveis e menu lateral em telas web maiores.

Administradores configuram salas e dispositivos. Colaboradores acessam somente as salas atribuídas e podem alterar o estado das saídas; a API aplica essas permissões em todas as requisições.

Tokens ficam no armazenamento seguro nativo nos aparelhos e no armazenamento local do navegador na versão web. As fotos protegidas são carregadas com autenticação da API.

## Exportar para web

```bash
npm run build:web
```

O export estático é salvo em `dist/`.
