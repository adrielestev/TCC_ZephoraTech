# Firmware ESP32: Wi-Fi e handshake

Este firmware cobre somente a conexão Wi-Fi e o handshake inicial/renovação de token com o backend Zephora. Ele ainda não consulta comandos nem envia estados dos sensores.

## Configuração

1. Abra esta pasta no PlatformIO e copie `include/secrets.example.h` para `include/secrets.h`.
2. Preencha SSID/senha, URL da API e a credencial de dispositivo de 64 caracteres hexadecimais. Não é necessário configurar ID da sala no firmware. `secrets.h` está ignorado pelo Git.
3. No backend, cadastre na sala o MAC exibido no monitor serial, no formato `AA:BB:CC:DD:EE:FF`, e gere a credencial do dispositivo para essa sala. O MAC precisa corresponder exatamente ao ESP32.
4. Para testes na rede local, use o IP do computador que executa a API, por exemplo `http://192.168.1.50:3000` — não use `localhost`.
5. Em produção, use HTTPS e configure o certificado CA raiz em `API_ROOT_CA`; a validação TLS não é desativada.

O ESP32 envia `POST /rooms/handshake` sem corpo ou ID de sala, com os headers `X-Device-MAC` e `X-Device-Credential`. O backend localiza a sala pelo MAC e valida a credencial vinculada àquela sala. O `access_token` retornado fica somente em RAM e o handshake é renovado antes do vencimento. O MAC é impresso no monitor serial e enviado no handshake.

O backend precisa estar acessível pela rede e escutando na porta configurada (padrão `3000`). Configure e compile o projeto com o ambiente `esp32dev` do PlatformIO.