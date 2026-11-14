# Zephora ESP32

Firmware dos módulos ESP32 que monitoram sensores, controlam aparelhos e
sincronizam estados com a API do Zephora.

## Requisitos

- VS Code com PlatformIO;
- placa ESP32 compatível com `esp32dev`;
- API do Zephora em execução;
- cabo USB para gravação.

## Configuração da placa

1. Edite [`src/hardware/hardware_setup.cpp`](./src/hardware/hardware_setup.cpp)
   para definir aparelhos e pinos.
2. Em [`platformio.ini`](./platformio.ini), altere
   `ZEPHORA_PORTAL_PASSWORD`.
3. Para HTTPS em produção, configure o certificado raiz em
   [`include/server_ca.h`](./include/server_ca.h).
4. Compile e grave:

```bash
pio run -t upload
pio device monitor
```

O monitor serial usa 115200 baud.

## Primeiro uso

1. No primeiro boot, o ESP32 gera uma credencial e abre a rede
   `Zephora-XXXXXX`.
2. Acesse `http://192.168.4.1` e informe o Wi-Fi e a URL da API.
3. No aplicativo, abra **Administração > Módulos ESP32 > Novo módulo** e
   cadastre a credencial exibida.
4. Selecione os aparelhos descobertos e associe-os às salas.

A comunicação usa `POST /api/device-sync`. A API envia os comandos pendentes
e recebe o estado atual dos aparelhos.

## Simulação no Wokwi

O ambiente `wokwi` já define Wi-Fi, URL da API e credencial no
[`platformio.ini`](./platformio.ini). Substitua esses valores por uma API
acessível publicamente, pois o simulador não acessa `localhost`.

```bash
pio run -e wokwi
```

Depois, abra o projeto na extensão Wokwi do VS Code e inicie a simulação.

## Testes

Os testes do núcleo podem ser executados sem uma placa:

```bash
scripts/run_tests.sh
```

O script precisa de uma cópia do ArduinoJson e, para o teste de contrato, de
um backend configurado. Consulte o próprio script para variáveis opcionais.

## Estrutura

```text
src/core/       protocolo e regras independentes de hardware
src/platform/   Wi-Fi, portal, armazenamento e comunicação HTTP
src/hardware/   sensores, relés e configuração dos pinos
test/           testes nativos e de contrato
```
