# Zephora

Sistema de automação de salas com aplicativo multiplataforma, API e módulos
ESP32. O projeto permite cadastrar salas, aparelhos e automações, além de
acompanhar o estado dos dispositivos.

## Componentes

- [`backend/`](./backend): API REST em Node.js, Express e SQLite.
- [`mobile/`](./mobile): aplicativo Android, iOS e web com Expo/React Native.
- [`esp32/`](./esp32): firmware dos módulos ESP32 com PlatformIO.

## Requisitos

- Node.js 22.13 ou superior
- npm
- PlatformIO (apenas para o firmware)

## Início rápido

1. Inicie a API seguindo [`backend/README.md`](./backend/README.md).
2. Configure e execute o aplicativo seguindo [`mobile/README.md`](./mobile/README.md).
3. Para usar uma placa ou o Wokwi, siga [`esp32/README.md`](./esp32/README.md).

A API deve estar disponível antes do aplicativo e dos módulos ESP32. Por
padrão, ela usa `http://localhost:3333`.

## Estrutura do repositório

```text
backend/  API, banco de dados e testes
mobile/   aplicativo Expo
esp32/    firmware e testes do núcleo
```

## Licença

Distribuído sob a [licença MIT](./LICENSE).
