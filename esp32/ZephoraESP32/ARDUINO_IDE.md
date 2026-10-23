# Zephora ESP32 — Arduino IDE

Este pacote é um sketch completo para ESP32 DevKit. Ele foi preparado para iniciar sem `config.h` e fazer a configuração pelo Monitor Serial; assim, o ZIP não contém senhas, MAC de simulador ou credenciais da sala.

## Importar e gravar

1. Extraia `ZephoraESP32-ArduinoIDE.zip` mantendo a pasta `ZephoraESP32` inteira.
2. No Arduino IDE 2, abra `ZephoraESP32/ZephoraESP32.ino` em **File > Open**. Não abra só uma cópia do `.ino`: os headers em `src/` são parte obrigatória do sketch.
3. Instale **esp32 by Espressif Systems** pelo Boards Manager e **ArduinoJson 7.4.2** pelo Library Manager. Há links de busca para esses gerenciadores nos comentários do arquivo `.ino`.
4. Conecte a placa por USB, selecione **ESP32 Dev Module** e a porta COM da placa.
5. Clique em **Upload**. Depois abra o Monitor Serial em **115200 baud** e informe SSID, senha, URL da API e credencial da sala quando solicitado. Para rede sem senha ou campo opcional vazio, digite `<vazio>`.
6. Copie o MAC real mostrado no Serial para o cadastro da sala no Zephora. Não use o MAC `24:0A:C4:00:01:10` do Wokwi para a placa física.

Use na URL da API o endereço do computador alcançável pela placa na rede local, por exemplo `http://192.168.1.20:3000`; não use `localhost` nem `host.wokwi.internal`. Libere a porta no firewall se necessário.

Os arquivos `.h` e os drivers dentro de `src/` são incluídos pelo sketch; não são bibliotecas que precisam ser importadas separadamente. O ESP32 armazena a configuração de Serial na NVS. Para alterar os dados depois, reinicie a placa e envie `c` durante os primeiros cinco segundos.

Para HTTPS, crie `tls_config.h` a partir de `tls_config.example.h`, configure a CA raiz e recompile. O pacote não inclui uma CA específica do servidor.

Desconecte o circuito de 110 V durante a programação. A instalação das lâmpadas e dos relés deve ser feita com a alimentação isolada e revisada por pessoa habilitada.
