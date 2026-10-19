# Firmware Zephora para ESP32

O firmware acompanha a configuração de dispositivos cadastrada no backend. Após iniciar, autentica usando o MAC e a credencial da sala, consulta comandos, controla as saídas e envia leituras de entrada.

## Compilar para uma placa real

1. Instale o Arduino IDE, o pacote **esp32 by Espressif Systems 3.x** e as bibliotecas em `ZephoraESP32/libraries.txt`.
2. Para configurar por arquivo, copie `config.example.h` para `ZephoraESP32/config.h` e informe `WIFI_SSID`, `WIFI_PASSWORD`, `API_BASE_URL`, `DEVICE_CREDENTIAL` e, se necessário, `API_ROOT_CA`. Quando `config.h` existe, o firmware usa os dados dele em cada inicialização. Em HTTPS, informe a CA raiz; o firmware recusa HTTPS sem validar o certificado.
3. Abra `ZephoraESP32/ZephoraESP32.ino`, selecione ESP32 Dev Module, envie o firmware e abra o Monitor Serial em **115200 baud**.
4. Se `config.h` existir, os dados de rede e a credencial vêm desse arquivo. Sem `config.h`, na primeira inicialização o Monitor Serial mostra o MAC Wi-Fi e solicita SSID, senha e credencial da sala. Cadastre o MAC exibido no app; a senha pode ficar vazia para rede aberta.
5. Sem `config.h`, os dados informados pelo Monitor Serial ficam salvos na memória NVS do ESP32. Para alterá-los, reinicie e envie `c` seguido de Enter nos primeiros cinco segundos. Na reconfiguração, Enter mantém o valor atual; digite `<vazio>` para limpar um campo.

Para compilar os binários do Wokwi local, instale o Arduino CLI e, dentro de `esp32/ZephoraESP32`, execute `arduino-cli compile --fqbn esp32:esp32:esp32 --output-dir build .`.

Use módulos de relé ou drivers próprios para cargas reais. GPIO não pode alimentar uma lâmpada ligada à rede elétrica. Evite pinos de flash, pinos de boot e GPIO 34–39 como saídas.

Para ligação física, conecte o PIR em VCC, GND e OUT ao GPIO cadastrado. Para contato magnético/interruptor, ligue entre GPIO e GND (o firmware ativa `INPUT_PULLUP`). O DS18B20 precisa de DQ no GPIO cadastrado e resistor de 4,7 kΩ entre DQ e 3V3. Alimente servos e motores por uma fonte/driver dimensionados para a carga e una o GND das fontes ao GND do ESP32.

## Export Wokwi

O arquivo `Zephora-Wokwi.zip` contém o sketch, diagrama, bibliotecas e configuração para importar para um projeto ESP32. O circuito simula uma lâmpada LED no GPIO 23 e um PIR no GPIO 27. Durante a simulação, clique no PIR e escolha **Simulate Motion**.

No Wokwi, adicione `config.h` a partir de `config.example.h`, configure `WIFI_SSID` como `Wokwi-GUEST`, deixe `WIFI_PASSWORD` vazio e cole a credencial da sala em `DEVICE_CREDENTIAL`. Cadastre a sala com MAC `24:0A:C4:00:01:10`. No app, crie:

| Nome | `device_key` | Tipo | Direção | Controle | GPIO |
| --- | --- | --- | --- | --- | ---: |
| Lâmpada | `lampada` | `RELE` | `OUTPUT` | `DIGITAL` | 23 |
| Presença | `presenca` | `PIR_SENSOR` | `INPUT` | `DIGITAL` | 27 |

O Wokwi precisa do Private IoT Gateway para chegar a uma API na rede local; nesse caso use `http://host.wokwi.internal:3000`. O gateway público não acessa sua rede local. Como alternativa, configure o endereço HTTPS de uma API pública acessível. O Wokwi disponibiliza a rede `Wokwi-GUEST` sem senha.

## Tipos suportados

- `RELE`: saída digital com polaridade configurável.
- `PWM`: LEDC com percentual, frequência e inversão configuráveis.
- `SERVO`: posição percentual convertida para o intervalo angular configurado, em 50 Hz.
- `REED_SWITCH`, `CONTACT_SENSOR`, `PIR_SENSOR`: entrada digital com polaridade, debounce e retenção PIR.
- `TEMPERATURE`: sensor DS18B20 no GPIO definido; use um GPIO por sensor para manter o vínculo da leitura inequívoco.

O projeto usa Arduino-ESP32 3.x. HTTP está previsto para simulação local; para uso real, configure HTTPS com a CA confiável.

Com `config.h`, SSID, senha e credencial são lidos do arquivo a cada inicialização. Sem esse arquivo, são solicitados no Monitor Serial e armazenados na memória persistente do ESP32. A URL da API e a CA HTTPS são definidas em `config.h` antes de compilar.
