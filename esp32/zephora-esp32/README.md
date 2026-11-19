# Zephora — Firmware do ESP32

Firmware padrão do módulo ESP32 do Zephora (Arduino-ESP32 3.x · PlatformIO · ArduinoJson).
Fala HTTP/HTTPS com a API (`POST /api/device-sync`) e implementa o fluxo do Miro **"Admin: cadastro de ESP32 e aparelhos"**.

## O que é padrão e o que muda por instalação

| Padronizado (não editar) | Específico da instalação |
|---|---|
| Geração da credencial única, portal de configuração, Wi-Fi, NTP, HTTPS, sincronização, recuo em falhas | **`src/hardware/hardware_setup.cpp`** — quais aparelhos existem e em quais pinos |

Tipos prontos: `RelayLight` (luz por relé → tipo `light`), `PirSensor` (→ `presence_sensor`) e `Dht22Sensor` (→ `temperature_sensor`).
Novo tipo de aparelho: classe em `src/hardware/` + entrada em `src/core/device_catalog.h` + o mesmo tipo no backend (`device-types.js` e o CHECK de `devices.type`).

## Fluxo de uso (igual ao do app)

1. **Instalador** grava o firmware. No 1º boot o ESP32 gera a **credencial** (32 bytes aleatórios em hex = 64 caracteres) e abre o Wi-Fi **`Zephora-XXXXXX`** (senha em `include/portal_password.h`).
2. Conectado nesse Wi-Fi, abra `http://192.168.4.1` (o celular costuma abrir sozinho). A página mostra a **credencial** (botão *Copiar*) e pede o Wi-Fi da escola e o endereço da API. *Salvar e reiniciar.*
3. **Admin**, no app: *Administração › Módulos ESP32 › Novo módulo* → cola a credencial (passo 1).
4. O ESP32 sincroniza, vira **online** (passo 2) e os aparelhos aparecem para o admin escolher sala e nome (passos 3 e 4).

A credencial também é impressa na serial (115200) a cada boot. Se o ESP32 ligar antes do cadastro no app, a API responde 401 e ele tenta de novo com intervalo crescente (15 s → 2 min); basta cadastrar.

## Gravando

```bash
# 1) edite src/hardware/hardware_setup.cpp (aparelhos e pinos)
# 2) em include/portal_password.h troque a senha do portal (8–63 caracteres)
# 3) HTTPS? cole o certificado RAIZ da CA em include/server_ca.h  (Let's Encrypt: ISRG Root X1)
pio run -t upload && pio device monitor
```

Configuração desta instalação: PIR OUT → GPIO 27 · DHT22 DATA → GPIO 26 · relés IN1–IN4 → GPIOs 18, 19, 21 e 22. VCC/GND conforme os módulos (relés e HC-SR501 costumam usar 5 V; o DHT22 normalmente usa 3,3 V).
Pinos seguros: 13, 14, 16–19, 21–23, 25–27, 32, 33. Evite 0, 2, 5, 12, 15 (boot), 6–11 (flash) e 34–39 como saída.

## Botão BOOT e LED

| Ação | Efeito |
|---|---|
| Segurar 3 s e soltar | Reabre o portal (fecha sozinho após 10 min sem uso) |
| Segurar 15 s | Restaura de fábrica: apaga tudo, **inclusive a credencial**. Remova o módulo antigo no app e cadastre o novo código |

| LED (GPIO 2) | Significado |
|---|---|
| Pisca rápido | Portal de configuração aberto |
| Pisca lento | Sem Wi-Fi (ou aguardando o relógio, em HTTPS) |
| Apagado, pulso a cada 5 s | Sincronizando normalmente |
| Dois pulsos a cada 2 s | Servidor não reconhece a credencial: cadastre no app |
| Quase fixo | Servidor ou rede com falha |

## Gravando com Arduino CLI (alternativa ao PlatformIO)

O projeto já traz `zephora-esp32.ino` e `sketch.yaml`. **A pasta do projeto precisa se chamar `zephora-esp32`** (mesmo nome do `.ino`).

```powershell
arduino-cli config init
arduino-cli config add board_manager.additional_urls https://espressif.github.io/arduino-esp32/package_esp32_index.json
arduino-cli core update-index
arduino-cli core install esp32:esp32     # versão 3.x
arduino-cli lib install ArduinoJson      # versão 7.x

arduino-cli board list                   # descobre a porta (ex.: COM3)
arduino-cli compile .
arduino-cli upload -p COM3 .
arduino-cli monitor -p COM3 -c baudrate=115200
```

Sem porta COM na lista, o problema é cabo (precisa ser de dados) ou driver do chip USB (CP2102 / CH340).
Travou em `Connecting......`? Segure o botão **BOOT** até começar a gravar.

## Como se comporta

- **Ciclo**: envia o estado de todos os aparelhos, recebe `commands` e os aplica. Ritmo ditado pelo servidor (`pollIntervalMs`, limitado a 1–60 s). Mudança de sensor ou comando recebido antecipa o próximo ciclo (mínimo 1 s entre chamadas, abaixo do limite de 120/min da API).
- **Automações rodam no servidor** (ex.: presença → luz). Sem rede ou servidor, as luzes **mantêm o último estado** e as automações só voltam quando a comunicação voltar.
- **Reinício do ESP32**: relés sempre voltam **desligados**; o servidor reenvia o estado desejado no primeiro ciclo.
- **PIR**: ignora o aquecimento (45 s) e segura "presença" por 30 s sem movimento (configurável por sensor).
- **Falhas**: recuo exponencial (rede/servidor 2→60 s; 401 15→120 s; 429 respeita `Retry-After`). Wi-Fi fora por 10 min reinicia o módulo.
- **Segurança**: comandos só são aplicados se o canal existir, for controlável e o estado tiver exatamente a chave esperada, booleana; resposta limitada a 8 KB; HTTPS valida o certificado (sem CA configurada o firmware recusa conectar; `ZEPHORA_ALLOW_INSECURE_TLS=1` só para desenvolvimento); o endereço aceita só `http(s)://host[:porta][/prefixo]`.

## Simulação virtual (Wokwi)

Arquivos: `diagram.json` (circuito), `wokwi.toml` e o ambiente `wokwi` do `platformio.ini`.

1. Exponha o backend com um endereço público, pois o simulador não enxerga o `localhost` (ex.: `cloudflared tunnel --url http://localhost:3333`).
2. Em `platformio.ini` (`[env:wokwi]`) troque `ZEPHORA_DEV_SERVER_URL` pelo endereço do túnel e `ZEPHORA_DEV_CREDENTIAL` por uma credencial sua (64 hex).
3. `pio run -e wokwi`, depois abra a pasta no VS Code com a extensão **Wokwi** e use *Start Simulation* (ou envie o projeto ao wokwi.com).
4. No app, cadastre a mesma credencial em *Módulos ESP32*. O módulo fica online e você escolhe os aparelhos.
5. Clique no PIR para simular movimento; ligue/desligue a luz pelo app e veja o relé e o LED "Luz".

O ambiente `wokwi` pula o portal (o simulador não tem ponto de acesso), usa Wi-Fi `Wokwi-GUEST`, aceita HTTPS sem validar certificado e encurta o aquecimento do PIR. Se o relé do simulador funcionar invertido, mude `ZEPHORA_RELAY_ACTIVE_LOW` para `1`. Nomes de pinos do `diagram.json` não foram verificados no Wokwi: se alguma ligação der erro, refaça-a pela interface.

## Testes (no computador, sem placa)

```bash
git clone --depth 1 https://github.com/bblanchon/ArduinoJson.git /tmp/ArduinoJson
ARDUINOJSON_DIR=/tmp/ArduinoJson/src BACKEND_DIR=/caminho/zephora-backend scripts/run_tests.sh
```

- `test/native/test_core.cpp`: 21 testes do núcleo (payload, comandos suspeitos, filtro do PIR, endereço, agendador, estouro do `millis()`).
- `test/contract.test.js`: o **código C++ real** conversando com a **API real** do backend (cadastro, 401 antes do cadastro, descoberta de aparelhos, comando do app, automação por presença).

## Estrutura

```
include/config.h, server_ca.h     constantes e certificado raiz
src/core/                         lógica pura (sem Arduino) — testada no PC
src/platform/                     NVS, portal, HTTP, LED (Arduino)
src/hardware/                     RelayLight, PirSensor e hardware_setup.cpp
zephora-esp32.ino, sketch.yaml     entrada do Arduino CLI/IDE (o código está em src/)
src/main.cpp                      fluxo: boot → portal/Wi-Fi → ciclo de sincronização
```

## Limitações

- A camada Arduino (`src/platform`, `src/hardware`, `main.cpp`) **ainda não foi compilada nem testada em placa**; o núcleo e o contrato com a API foram.
- A credencial fica na NVS sem criptografia (ative *flash encryption* do ESP32 se o risco de acesso físico importar).
- O Wi-Fi do portal usa senha única por build (`include/portal_password.h`); quem a conhece e está ao alcance durante a configuração vê a credencial. Troque a senha e use o portal só na instalação.
- Se o instalador errar a senha do Wi-Fi, segure BOOT 3 s para reabrir o portal.
