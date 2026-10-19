// Copy this file to config.h and replace the credential with the one-time
// value generated for this room in the Zephora app.
#define WIFI_SSID "Wokwi-GUEST"
#define WIFI_PASSWORD ""
#define WIFI_CHANNEL 6

// Local API using the Wokwi Private IoT Gateway. For cloud hosting, use HTTPS.
#define API_BASE_URL "http://host.wokwi.internal:3000"
#define DEVICE_CREDENTIAL "PASTE_A_CREDENCIAL_DA_SALA_AQUI"

// Leave blank to use WiFi.macAddress(). Set only when the room uses another MAC.
#define DEVICE_MAC_OVERRIDE ""

// For HTTPS, paste the PEM root CA certificate between the quotes.
#define API_ROOT_CA ""
