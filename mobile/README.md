# Zephora Mobile

Aplicativo mobile da plataforma Zephora para gerenciamento e monitoramento de salas automatizadas integradas a dispositivos ESP32.

> ⚠️ **Status do projeto:** o desenvolvimento do aplicativo ainda não foi iniciado. Este documento define a stack, a arquitetura e as diretrizes que serão utilizadas durante a implementação.

## Stack

- JavaScript
- React Native
- Expo SDK 56
- Axios
- React Navigation
- AsyncStorage

## Objetivo

O aplicativo permitirá que usuários autenticados interajam com o ecossistema Zephora através de dispositivos móveis, oferecendo funcionalidades como:

- Autenticação e gerenciamento de conta;
- Visualização de salas;
- Monitoramento de sensores;
- Controle de atuadores;
- Gerenciamento de colaboradores;
- Acompanhamento do status dos dispositivos vinculados às salas.

## Arquitetura

O projeto seguirá uma arquitetura orientada por **features (módulos)**.

Cada módulo será responsável por encapsular suas próprias telas, componentes, serviços, hooks e validações. Essa abordagem facilita a manutenção, reduz o acoplamento entre funcionalidades e melhora a escalabilidade da aplicação.

### Exemplo De Estrutura de Pastas

```text
src/
├── api/
│   ├── axios.js
│   └── endpoints.js
│
├── navigation/
│   ├── AppNavigator.js
│   ├── AuthNavigator.js
│   └── index.js
│
├── components/
│   ├── Button/
│   ├── Input/
│   ├── Card/
│   └── Loading/
│
├── hooks/
│   └── useAuth.js
│
├── contexts/
│   └── AuthContext.js
│
├── utils/
│   ├── storage.js
│   ├── constants.js
│   └── formatters.js
│
├── features/
│   ├── auth/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── validations/
│   │
│   ├── users/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── validations/
│   │
│   ├── rooms/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── validations/
│   │
│   ├── sensors/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── validations/
│   │
│   └── collaborators/
│       ├── screens/
│       ├── components/
│       ├── services/
│       ├── hooks/
│       └── validations/
│
├── App.js
└── index.js
```

## Navegação

A navegação será baseada em **React Navigation**, separando os fluxos de autenticação e aplicação.

Exemplo de estrutura:

```text
AuthNavigator
├── Login
├── Register
├── VerifyEmail
├── ForgotPassword
└── ResetPassword

AppNavigator
├── Home
├── Rooms
├── RoomDetails
├── Sensors
├── Profile
└── Settings
```

## Comunicação com a API

Todas as requisições HTTP serão centralizadas através do Axios.

Responsabilidades da camada de API:

- Configuração da URL base;
- Inclusão automática do JWT;
- Interceptors de requisição;
- Interceptors de resposta;
- Tratamento global de erros;
- Renovação e invalidação de sessão.

## Gerenciamento de Estado

Inicialmente será utilizada a combinação de:

- Context API;
- Hooks customizados;
- AsyncStorage para persistência local.

Essa abordagem é suficiente para a primeira versão da aplicação e mantém a complexidade reduzida.

## Instalação

```bash
npm install
```

## Executando o Projeto

### Iniciar Expo

```bash
npm start
```

## Variáveis de Ambiente

Exemplo:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## Integração com o Backend

O aplicativo consumirá a API do Zephora Backend.

A autenticação será realizada via JWT e o token será armazenado localmente para manutenção da sessão do usuário.

## Status

### Não iniciado

As funcionalidades descritas neste documento representam apenas o planejamento inicial da aplicação. Nenhuma tela, fluxo ou integração foi implementado até o momento.