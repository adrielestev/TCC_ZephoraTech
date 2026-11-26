# Zephora

Sistema de automação de salas com aplicativo multiplataforma, API e módulos
ESP32. O projeto permite cadastrar salas, aparelhos e automações, além de
acompanhar o estado dos dispositivos.

## Componentes

- [`backend/`](./backend): API REST em Node.js, Express e SQLite.
- [`mobile/`](./mobile): aplicativo Android, iOS e web com Expo/React Native.
- [`esp32/`](./esp32): código-fonte do firmware dos módulos ESP32.

## Requisitos

- Node.js 22 ou superior
- npm
- arduino cli (apenas para o firmware)

## Início rápido

1. Inicie a API seguindo [`backend/README.md`](./backend/README.md).
2. Configure e execute o aplicativo seguindo [`mobile/README.md`](./mobile/README.md).
3. Para usar o firmware [`esp32/`](./esp32), siga as instruções.

A API deve estar disponível antes do aplicativo e dos módulos ESP32. Por
padrão, ela usa `http://localhost:3333`.

## Gravação e botões do ESP32

Na pasta [`esp32/`](./esp32) dentro terá `zephora-esp32`, entre nela. O firmware pode ser compilado e gravado usando
o Arduino CLI:

```powershell
arduino-cli config init
arduino-cli config add board_manager.additional_urls https://espressif.github.io/arduino-esp32/package_esp32_index.json
arduino-cli core update-index
arduino-cli core install esp32:esp32
arduino-cli lib install ArduinoJson
arduino-cli lib install "DHT sensor library"
arduino-cli lib install "Adafruit Unified Sensor"

arduino-cli board list
arduino-cli compile .
arduino-cli upload -p COM3 .
arduino-cli monitor -p COM3 -c baudrate=115200
```

Substitua `COM3` pela porta serial mostrada por `arduino-cli board list`. Se o
`upload` ficar parado em `Connecting......`, segure o botão **BOOT** até a
gravação começar e solte-o.

### EN, RST ou RESET

O botão **EN** (também chamado **RST** ou **RESET**) reinicia o ESP32, como
desligar e ligar novamente. Ele não apaga dados: o Wi-Fi, o endereço da API e
a credencial continuam salvos. Use-o para acompanhar o boot desde o início no
monitor serial, quando a credencial é exibida.

### BOOT (GPIO 0)

O botão **BOOT** tem funções diferentes conforme o momento:

| Ação | Efeito |
| --- | --- |
| Durante a gravação | Se o `upload` ficar em `Connecting......`, segure até começar a gravação e solte. |
| Segurar por 3 segundos e soltar | Reinicia e abre o portal de configuração Wi-Fi `Zephora-XXXXXX`, que fecha após 10 minutos sem uso. |
| Segurar por 15 segundos | Restaura a configuração de fábrica e apaga tudo, inclusive a credencial. O módulo gera uma nova credencial; remova o módulo antigo no aplicativo e cadastre o novo código. |
| Apertar rapidamente | Não faz nada. |

Antes de gravar, confira os pinos em
`zephora-esp32/src/hardware/hardware_setup.cpp`. Esta configuração usa o sensor
de presença no GPIO 27, o DHT22 no GPIO 26 e os quatro relés nos GPIOs 18, 19,
21 e 22. A senha do portal fica em
`zephora-esp32/include/portal_password.h`.

## Estrutura do repositório

```text
backend/  API, banco de dados
mobile/   aplicativo Expo
esp32/ firmware
```

## Licença

Distribuído sob a [licença MIT](./LICENSE).
