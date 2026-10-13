#include <Arduino.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClient.h>
#include <WiFiClientSecure.h>

#include <ctype.h>
#include <stdint.h>
#include <string.h>

#if __has_include("secrets.h")
#include "secrets.h"
#else
#error "Crie include/secrets.h a partir de include/secrets.example.h e configure suas credenciais."
#endif

namespace {
constexpr uint32_t WIFI_RETRY_INTERVAL_MS = 10000;
constexpr uint32_t HANDSHAKE_RETRY_INTERVAL_MS = 5000;
constexpr uint32_t TOKEN_REFRESH_MARGIN_SECONDS = 60;
constexpr uint32_t HTTP_TIMEOUT_MS = 10000;

String deviceMac;
String accessToken;
uint32_t nextWifiAttemptAt = 0;
uint32_t nextHandshakeAt = 0;

bool isDue(uint32_t deadline) {
  return static_cast<int32_t>(millis() - deadline) >= 0;
}

bool isCredentialValid() {
  const size_t length = strlen(DEVICE_CREDENTIAL);
  if (length != 64) return false;

  for (size_t index = 0; index < length; ++index) {
    if (!isxdigit(static_cast<unsigned char>(DEVICE_CREDENTIAL[index]))) {
      return false;
    }
  }
  return true;
}

String handshakeUrl() {
  String baseUrl = API_BASE_URL;
  while (baseUrl.endsWith("/")) baseUrl.remove(baseUrl.length() - 1);
  return baseUrl + "/rooms/handshake";
}

bool connectToWifi() {
  if (WiFi.status() == WL_CONNECTED) return true;

  Serial.printf("Conectando ao Wi-Fi: %s\n", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  const uint32_t startedAt = millis();
  while (WiFi.status() != WL_CONNECTED &&
         static_cast<uint32_t>(millis() - startedAt) < 20000) {
    delay(250);
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi indisponível; nova tentativa em alguns segundos.");
    return false;
  }

  Serial.printf("Wi-Fi conectado. IP: %s\n", WiFi.localIP().toString().c_str());
  return true;
}

bool performHandshake() {
  if (!isCredentialValid()) {
    Serial.println("Handshake cancelado: DEVICE_CREDENTIAL deve ter 64 caracteres hexadecimais.");
    nextHandshakeAt = millis() + HANDSHAKE_RETRY_INTERVAL_MS;
    return false;
  }

  const String url = handshakeUrl();
  const bool usesHttps = url.startsWith("https://");
  WiFiClient plainClient;
  WiFiClientSecure secureClient;
  HTTPClient http;

  if (usesHttps) {
    if (API_ROOT_CA[0] == '\0') {
      Serial.println("HTTPS exige o certificado CA raiz em API_ROOT_CA; handshake não enviado.");
      nextHandshakeAt = millis() + HANDSHAKE_RETRY_INTERVAL_MS;
      return false;
    }
    secureClient.setCACert(API_ROOT_CA);
    if (!http.begin(secureClient, url)) {
      Serial.println("Não foi possível iniciar a conexão HTTPS com a API.");
      nextHandshakeAt = millis() + HANDSHAKE_RETRY_INTERVAL_MS;
      return false;
    }
  } else {
    if (!http.begin(plainClient, url)) {
      Serial.println("Não foi possível iniciar a conexão HTTP com a API.");
      nextHandshakeAt = millis() + HANDSHAKE_RETRY_INTERVAL_MS;
      return false;
    }
  }

  http.setTimeout(HTTP_TIMEOUT_MS);
  http.addHeader("X-Device-MAC", deviceMac);
  http.addHeader("X-Device-Credential", DEVICE_CREDENTIAL);
  http.addHeader("Accept", "application/json");

  Serial.printf("Enviando handshake para %s (MAC %s)\n", url.c_str(), deviceMac.c_str());
  const int statusCode = http.POST("");
  const String responseBody = statusCode > 0 ? http.getString() : String();
  http.end();

  if (statusCode < 200 || statusCode >= 300) {
    Serial.printf("Handshake falhou; HTTP %d", statusCode);
    if (responseBody.length() > 0) Serial.printf(": %s", responseBody.c_str());
    Serial.println();
    nextHandshakeAt = millis() + HANDSHAKE_RETRY_INTERVAL_MS;
    return false;
  }

  JsonDocument response;
  const DeserializationError parseError = deserializeJson(response, responseBody);
  if (parseError) {
    Serial.printf("Resposta do handshake não é JSON válido: %s\n", parseError.c_str());
    nextHandshakeAt = millis() + HANDSHAKE_RETRY_INTERVAL_MS;
    return false;
  }

  const char* token = response["access_token"] | nullptr;
  const uint32_t expiresIn = response["expires_in"] | 0;
  if (token == nullptr || token[0] == '\0' || expiresIn == 0) {
    Serial.println("Resposta do handshake não contém access_token/expires_in válidos.");
    nextHandshakeAt = millis() + HANDSHAKE_RETRY_INTERVAL_MS;
    return false;
  }

  accessToken = token;
  const JsonObject room = response["room"].as<JsonObject>();
  const char* roomName = room["name"] | "(sem nome)";
  const uint32_t refreshIn = expiresIn > TOKEN_REFRESH_MARGIN_SECONDS
                                 ? expiresIn - TOKEN_REFRESH_MARGIN_SECONDS
                                 : expiresIn;
  nextHandshakeAt = millis() + refreshIn * 1000UL;

  Serial.printf("Handshake concluído para sala %s. Token válido por %lu s.\n",
                roomName, static_cast<unsigned long>(expiresIn));
  Serial.printf("MAC exposto pelo dispositivo: %s\n", deviceMac.c_str());
  Serial.printf("Sensores recebidos: %u\n",
                static_cast<unsigned>(response["sensors"].size()));
  // O token é mantido apenas em RAM e não deve ser impresso no log serial.
  return true;
}
}  // namespace

void setup() {
  Serial.begin(115200);
  delay(300);

  WiFi.mode(WIFI_STA);
  deviceMac = WiFi.macAddress();
  deviceMac.toUpperCase();
  Serial.printf("MAC do ESP32: %s\n", deviceMac.c_str());

  connectToWifi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    if (isDue(nextWifiAttemptAt)) {
      nextWifiAttemptAt = millis() + WIFI_RETRY_INTERVAL_MS;
      connectToWifi();
    }
    delay(100);
    return;
  }

  if (isDue(nextHandshakeAt)) {
    performHandshake();
  }

  delay(100);
}