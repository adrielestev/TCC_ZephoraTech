// Copie para config.h (ignorado pelo Git) e preencha os dados desta sala.
// A credencial aparece uma única vez no app Zephora, em Editar sala.
#define WIFI_SSID "Wokwi-GUEST"
#define WIFI_PASSWORD ""

// Simulador: mantenha o gateway Wokwi. Hardware real: informe o endereço
// alcançável pelo ESP32, por exemplo http://192.168.1.20:3000 ou HTTPS.
#define API_BASE_URL "http://host.wokwi.internal:3000"
#define DEVICE_CREDENTIAL "COLE_A_CREDENCIAL_DA_SALA_AQUI"

// O diagrama Wokwi usa este MAC. Para a placa real, deixe vazio para usar
// automaticamente o MAC Wi-Fi informado no Monitor Serial.
#define DEVICE_MAC_OVERRIDE "24:0A:C4:00:01:10"

// HTTPS exige a CA raiz do certificado do servidor, em PEM. Nunca use TLS
// sem validação de certificado em uma instalação real.
#define API_ROOT_CA ""
