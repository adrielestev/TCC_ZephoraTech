# Firmware Zephora ESP32

Firmware para **ESP32 DevKit** com um sensor PIR e duas saídas de relé. Os dispositivos são cadastrados na sala pelo app; o ESP32 recebe seus IDs, tipos e GPIOs pela API. O mesmo firmware funciona no Wokwi e na placa física.

## Como a integração funciona

1. O ESP32 conecta ao Wi-Fi e envia um handshake para `POST /api/device/handshake`, nos cabeçalhos `X-Device-MAC` e `X-Device-Credential`.
2. A API retorna um JWT e a configuração dos dispositivos da sala.
3. A cada 1,5 segundo, o firmware consulta `GET /api/device/commands` com `Authorization: Bearer <JWT>` e aplica `desired_state` aos relés.
4. O PIR envia `POST /api/device/devices/:id/state` com `{ "value": 0 }` ou `{ "value": 1 }` quando o estado estável muda. O backend avalia as automações e altera o estado desejado da saída; o ESP32 aplica a alteração na próxima consulta.
5. Em caso de token expirado, o dispositivo faz um novo handshake. Falhas de Wi-Fi e API são repetidas sem bloquear o loop por períodos longos.

O contrato está implementado no firmware e nas rotas `backend/src/routes/esp32.routes.js` e `backend/src/services/esp32.service.js`. Um mesmo controlador pode sincronizar todos os dispositivos da sala; o setup físico previsto usa uma entrada `presence` e duas saídas `relay`.

## Simular no Wokwi

1. Instale Arduino CLI, o core `esp32:esp32` versão 3.x e ArduinoJson 7.4.2:

   ```powershell
   arduino-cli core update-index
   arduino-cli core install esp32:esp32
   arduino-cli lib install ArduinoJson@7.4.2
   ```

2. Copie `config.example.h` para `ZephoraESP32/config.h`. Ele já vem com o SSID, endereço e MAC usados no diagrama Wokwi; preencha `DEVICE_CREDENTIAL` com a credencial gerada para a sala no app.
3. Cadastre no app o MAC `24:0A:C4:00:01:10` e gere a credencial do ESP32.
4. Cadastre os dispositivos abaixo. Para os LEDs do diagrama, configure `active_low` como `false` nos dois relés.
5. Compile a partir da pasta `esp32/ZephoraESP32`:

   ```powershell
   arduino-cli compile --fqbn esp32:esp32:esp32 --output-dir build .
   ```

6. Abra `diagram.json` no Wokwi. Use o **Private IoT Gateway** para a API local; o host configurado é `host.wokwi.internal:3000`. O gateway precisa estar ativo e a API deve escutar na porta 3000. Para uma API HTTPS acessível publicamente, altere `API_BASE_URL` e configure a CA.

No circuito, o PIR está no GPIO 27, a simulação da primeira fileira no GPIO 23 e a segunda no GPIO 22. Clique no PIR e use **Simulate Motion**.

## Placa física

1. Grave o sketch em uma ESP32 DevKit com core Arduino-ESP32 3.x.
2. Abra o Monitor Serial em 115200 baud. Na primeira inicialização, informe SSID, senha, URL base da API, credencial da sala e, se necessário, um MAC alternativo. A URL aceita `http://` ou `https://`.
3. O firmware imprime o MAC Wi-Fi real; cadastre exatamente esse MAC na sala antes do handshake. Os dados de Wi-Fi e a credencial ficam na NVS do ESP32. Para reconfigurar, reinicie e pressione `c` + Enter nos primeiros cinco segundos. Use `<vazio>` para limpar um campo opcional.
4. Para HTTPS, copie `tls_config.example.h` para `tls_config.h`, adicione a CA raiz do certificado e recompile. O firmware recusa HTTPS sem CA e valida o certificado. Para HTTP em uma LAN de confiança, não é necessário arquivo TLS.

Não versione `config.h`, `tls_config.h`, senhas ou credenciais. A credencial é secreta e deve ser rotacionada no app se for exposta.

## Dispositivos e configuração

| Nome sugerido | Tipo | Direção | GPIO no Wokwi | Configuração |
| --- | --- | --- | ---: | --- |
| Presença | `presence` | Entrada | 27 | `active_high: true`, `debounce_ms: 80`, `hold_ms: 0` |
| Fileira 1 | `relay` | Saída | 23 | `active_low: false` no LED Wokwi; normalmente `true` em módulo de relé ativo em nível baixo |
| Fileira 2 | `relay` | Saída | 22 | `active_low: false` no LED Wokwi; normalmente `true` em módulo de relé ativo em nível baixo |

No firmware, os únicos tipos físicos habilitados neste escopo são `presence` e `relay`. Outros tipos cadastrados são ignorados. Use GPIOs disponíveis e seguros no ESP32 DevKit; embora o formulário permita números maiores, o chip não dispõe de todos esses GPIOs. O firmware recusa como saídas os pinos de flash, UART, strap de boot e pinos somente de entrada.

No sensor `presence`, `debounce_ms` aceita de 0 a 300000 ms (5 minutos) e usa 80 ms quando omitido. O intervalo é aplicado tanto ao início quanto ao fim da detecção; por exemplo, `debounce_ms: 30000` exige 30 segundos de sinal estável antes de aceitar a mudança. `hold_ms` aceita de 0 a 300000 ms e mantém “presença detectada” depois que o sensor deixa de detectar movimento. O tempo de retenção começa depois de a transição para ausência passar pelo debounce; se o movimento voltar e permanecer pelo debounce, o temporizador é cancelado. Exemplo: `debounce_ms: 80`, `hold_ms: 30000` mantém a presença por 30 segundos após a ausência ser confirmada.

## Ligação elétrica

O PIR deve compartilhar GND com o ESP32; confira no datasheet se a saída do módulo é compatível com lógica de 3,3 V. Cada GPIO aciona somente a entrada de controle de um módulo de relé adequado — nunca a lâmpada diretamente. As fileiras de 110 V devem passar pelos contatos isolados e dimensionados do módulo, em montagem fechada e feita/revisada por pessoa habilitada. No Wokwi, use os LEDs do diagrama no lugar da rede elétrica.
