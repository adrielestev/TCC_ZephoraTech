/*
 * Zephora firmware for ESP32 DevKit (Arduino-ESP32 core 3.x).
 * Supports the final project's digital PIR input and relay outputs.
 * Configure the room, MAC, credential, GPIOs and devices in the Zephora app.
 */
#include <Arduino.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <vector>

#if __has_include("config.h")
#include "config.h"
#define ZEPHORA_STATIC_CONFIG 1
#else
#define ZEPHORA_STATIC_CONFIG 0
#endif

#if __has_include("tls_config.h")
#include "tls_config.h"
#endif

#ifndef WIFI_SSID
#define WIFI_SSID ""
#endif
#ifndef WIFI_PASSWORD
#define WIFI_PASSWORD ""
#endif
#ifndef API_BASE_URL
#define API_BASE_URL ""
#endif
#ifndef DEVICE_CREDENTIAL
#define DEVICE_CREDENTIAL ""
#endif
#ifndef DEVICE_MAC_OVERRIDE
#define DEVICE_MAC_OVERRIDE ""
#endif
#ifndef API_ROOT_CA
#define API_ROOT_CA ""
#endif

static constexpr uint32_t COMMAND_POLL_MS = 1500;
static constexpr uint32_t WIFI_RETRY_MS = 5000;
static constexpr uint32_t HTTP_TIMEOUT_MS = 5000;
static constexpr uint32_t REPORT_RETRY_MS = 3000;
static constexpr uint32_t HANDSHAKE_RETRY_INITIAL_MS = 5000;
static constexpr uint32_t HANDSHAKE_RETRY_MAX_MS = 5 * 60 * 1000;
static constexpr uint32_t MAX_PRESENCE_TIMING_MS = 5UL * 60UL * 1000UL;

struct Device {
  int id = 0;
  String name;
  String type;
  String direction;
  uint8_t pin = 0;
  bool activeLow = false;
  bool activeHigh = true;
  uint32_t debounceMs = 80;
  uint32_t holdMs = 0;
  bool configured = false;
  bool seen = false;
  bool hasRawState = false;
  bool rawState = false;
  bool debouncedState = false;
  bool stableState = false;
  bool absencePending = false;
  uint32_t rawChangedAt = 0;
  uint32_t absenceStartedAt = 0;
  bool appliedStateValid = false;
  float appliedState = 0;
  bool hasReportedState = false;
  float lastReportedState = 0;
  uint32_t nextReportAt = 0;
};

static std::vector<Device> devices;
static Preferences preferences;
static String wifiSsid;
static String wifiPassword;
static String apiBaseUrl;
static String deviceCredential;
static String deviceMacOverride;
static String deviceToken;
static uint32_t lastCommandPollAt = 0;
static uint32_t nextWifiAttemptAt = 0;
static uint32_t nextHandshakeAttemptAt = 0;
static uint32_t handshakeRetryDelayMs = HANDSHAKE_RETRY_INITIAL_MS;

static void scheduleHandshakeRetry() {
  nextHandshakeAttemptAt = millis() + handshakeRetryDelayMs;
  handshakeRetryDelayMs = min(handshakeRetryDelayMs * 2, HANDSHAKE_RETRY_MAX_MS);
}

static bool isOutput(const Device &device) {
  return device.direction == "output" && device.type == "relay";
}

static bool isPresenceInput(const Device &device) {
  return device.direction == "input" && device.type == "presence";
}

static String normalizedMac(String mac) {
  mac.toUpperCase();
  return mac;
}

static String deviceMac() {
  if (deviceMacOverride.length()) return normalizedMac(deviceMacOverride);
  return normalizedMac(WiFi.macAddress());
}

static String apiUrl(const String &path) {
  String base = apiBaseUrl;
  while (base.endsWith("/")) base.remove(base.length() - 1);
  return base + "/api/device" + path;
}

static bool validApiUrl(const String &url) {
  return url.startsWith("http://") || url.startsWith("https://");
}

static String readSerialLine(const char *prompt, const String &current,
                             bool allowEmpty = false) {
  Serial.println(prompt);
  if (current.length()) Serial.println("Pressione Enter para manter o valor atual.");
  String value;
  while (true) {
    if (Serial.available()) {
      value = Serial.readStringUntil('\n');
      value.trim();
      if (value == "<vazio>") return "";
      if (!value.length() && current.length()) return current;
      if (allowEmpty || value.length()) return value;
    }
    delay(10);
  }
}

static void configureFromSerial(bool firstSetup) {
  Serial.println("\n=== Configuracao Zephora ESP32 ===");
  Serial.printf("MAC Wi-Fi desta placa: %s\n", normalizedMac(WiFi.macAddress()).c_str());
  Serial.println("Cadastre este MAC na sala do aplicativo antes de conectar.");

  wifiSsid = readSerialLine("SSID da rede Wi-Fi:", firstSetup ? "" : wifiSsid);
  wifiPassword = readSerialLine("Senha do Wi-Fi (rede aberta: <vazio>):",
                                firstSetup ? "" : wifiPassword, true);
  apiBaseUrl = readSerialLine("URL base da API (ex.: http://192.168.1.20:3000):",
                              firstSetup ? "" : apiBaseUrl);
  deviceCredential = readSerialLine("Credencial gerada no app Zephora:",
                                    firstSetup ? "" : deviceCredential);
  deviceMacOverride = readSerialLine("MAC alternativo (opcional; <vazio> usa o MAC da placa):",
                                     firstSetup ? "" : deviceMacOverride, true);

  while (!validApiUrl(apiBaseUrl)) {
    Serial.println("A URL deve comecar com http:// ou https://.");
    apiBaseUrl = readSerialLine("URL base da API:", "");
  }
  if (!wifiSsid.length() || !deviceCredential.length()) {
    Serial.println("SSID e credencial sao obrigatorios. Reinicie e configure novamente.");
    while (true) delay(1000);
  }

  preferences.putString("ssid", wifiSsid);
  preferences.putString("wifi_pass", wifiPassword);
  preferences.putString("api_url", apiBaseUrl);
  preferences.putString("credential", deviceCredential);
  preferences.putString("mac_override", deviceMacOverride);
  preferences.putBool("configured", true);
  Serial.println("Configuracao salva na NVS. A credencial nao sera exibida novamente.");
}

static void loadConfiguration() {
#if ZEPHORA_STATIC_CONFIG
  wifiSsid = WIFI_SSID;
  wifiPassword = WIFI_PASSWORD;
  apiBaseUrl = API_BASE_URL;
  deviceCredential = DEVICE_CREDENTIAL;
  deviceMacOverride = DEVICE_MAC_OVERRIDE;
  if (!wifiSsid.length() || !validApiUrl(apiBaseUrl) || !deviceCredential.length() ||
      deviceCredential.startsWith("COLE_")) {
    Serial.println("Revise WIFI_SSID, API_BASE_URL e DEVICE_CREDENTIAL em config.h.");
  }
#else
  preferences.begin("zephora", false);
  const bool configured = preferences.getBool("configured", false);
  wifiSsid = preferences.getString("ssid", "");
  wifiPassword = preferences.getString("wifi_pass", "");
  apiBaseUrl = preferences.getString("api_url", "");
  deviceCredential = preferences.getString("credential", "");
  deviceMacOverride = preferences.getString("mac_override", "");
  if (!configured || !wifiSsid.length() || !validApiUrl(apiBaseUrl) ||
      !deviceCredential.length()) {
    configureFromSerial(true);
  } else {
    Serial.println("Pressione c e Enter nos primeiros 5 segundos para reconfigurar.");
    const uint32_t startedAt = millis();
    while (millis() - startedAt < 5000) {
      if (Serial.available() && Serial.read() == 'c') {
        while (Serial.available()) Serial.read();
        configureFromSerial(false);
        break;
      }
      delay(10);
    }
  }
#endif
}

static bool connectWifi() {
  if (WiFi.status() == WL_CONNECTED) return true;
  const uint32_t now = millis();
  if (now < nextWifiAttemptAt) return false;

  nextWifiAttemptAt = now + WIFI_RETRY_MS;
  Serial.printf("Conectando ao Wi-Fi %s...\n", wifiSsid.c_str());
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(wifiSsid.c_str(), wifiPassword.c_str());
  return false;
}

template <typename NetworkClient>
static int sendRequest(NetworkClient &client, const String &method,
                       const String &path, const String &body,
                       const String &bearer, String &responseBody,
                       bool handshake = false) {
  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);
  if (!http.begin(client, apiUrl(path))) return -1;

  http.addHeader("Accept", "application/json");
  if (method == "POST") http.addHeader("Content-Type", "application/json");
  if (handshake) {
    http.addHeader("X-Device-MAC", deviceMac());
    http.addHeader("X-Device-Credential", deviceCredential);
  } else if (bearer.length()) {
    http.addHeader("Authorization", "Bearer " + bearer);
  }

  const int status = method == "GET" ? http.GET() : http.POST(body);
  if (status > 0) responseBody = http.getString();
  http.end();
  return status;
}

static int requestApi(const String &method, const String &path,
                      const String &body, const String &bearer,
                      String &responseBody, bool handshake = false) {
  const String url = apiUrl(path);
  if (url.startsWith("https://")) {
    if (!API_ROOT_CA[0]) {
      Serial.println("HTTPS requer a CA raiz em API_ROOT_CA, no arquivo config.h.");
      return -1;
    }
    WiFiClientSecure client;
    client.setCACert(API_ROOT_CA);
    return sendRequest(client, method, path, body, bearer, responseBody, handshake);
  }
  if (!url.startsWith("http://")) return -1;

  WiFiClient client;
  return sendRequest(client, method, path, body, bearer, responseBody, handshake);
}

static bool performHandshake() {
  if (!deviceCredential.length() || WiFi.status() != WL_CONNECTED) return false;
  if (nextHandshakeAttemptAt &&
      static_cast<int32_t>(millis() - nextHandshakeAttemptAt) < 0) return false;

  String response;
  const int status = requestApi("POST", "/handshake", "{}", "", response, true);
  if (status != HTTP_CODE_OK) {
    Serial.printf("Handshake falhou (HTTP %d).\n", status);
    if (response.length()) Serial.printf("Resposta da API: %s\n", response.c_str());
    scheduleHandshakeRetry();
    return false;
  }

  JsonDocument json;
  if (deserializeJson(json, response)) {
    Serial.println("Handshake retornou JSON invalido.");
    scheduleHandshakeRetry();
    return false;
  }
  const char *token = json["token"] | "";
  if (!token[0]) {
    Serial.println("Handshake sem token na resposta da API.");
    scheduleHandshakeRetry();
    return false;
  }
  deviceToken = token;
  nextHandshakeAttemptAt = 0;
  handshakeRetryDelayMs = HANDSHAKE_RETRY_INITIAL_MS;
  Serial.printf("ESP32 autenticado na sala %d.\n", json["room_id"] | 0);
  return true;
}

static bool outputPinAllowed(uint8_t pin) {
  if (pin > 33 || (pin >= 6 && pin <= 11)) return false;
  // Evita UART e pinos de boot no DevKit classico.
  switch (pin) {
    case 0: case 1: case 2: case 3: case 5: case 12: case 15: return false;
    default: return true;
  }
}

static bool inputPinAllowed(uint8_t pin) {
  if (pin > 39 || (pin >= 6 && pin <= 11)) return false;
  switch (pin) {
    case 0: case 1: case 2: case 3: case 5: case 12: case 15: return false;
    default: return true;
  }
}

static void writeRelay(Device &device, bool active) {
  const uint8_t level = (active != device.activeLow) ? HIGH : LOW;
  digitalWrite(device.pin, level);
}

static void releaseDevice(Device &device) {
  if (device.configured && isOutput(device)) {
    writeRelay(device, false);
    pinMode(device.pin, INPUT);
  }
  device.configured = false;
}

static bool readDevice(JsonObjectConst json, Device &device) {
  device.id = json["id"] | 0;
  device.name = json["name"] | "Dispositivo";
  device.type = json["type"] | "";
  device.direction = json["direction"] | "";
  const int pin = json["pin"] | -1;
  if (device.id <= 0 || pin < 0 || pin > 39) return false;
  device.pin = static_cast<uint8_t>(pin);

  JsonObjectConst config = json["config"].as<JsonObjectConst>();
  if (isOutput(device)) {
    device.activeLow = config["active_low"] | false;
    if (!outputPinAllowed(device.pin)) {
      Serial.printf("GPIO %u recusado para o rele %s.\n", device.pin, device.name.c_str());
      return false;
    }
  } else if (isPresenceInput(device)) {
    device.activeHigh = config["active_high"] | true;
    device.debounceMs = config["debounce_ms"] | 80U;
    device.holdMs = config["hold_ms"] | 0U;
    if (device.debounceMs > MAX_PRESENCE_TIMING_MS)
      device.debounceMs = MAX_PRESENCE_TIMING_MS;
    if (device.holdMs > MAX_PRESENCE_TIMING_MS)
      device.holdMs = MAX_PRESENCE_TIMING_MS;
    if (!inputPinAllowed(device.pin)) {
      Serial.printf("GPIO %u recusado para o sensor %s.\n", device.pin, device.name.c_str());
      return false;
    }
  } else {
    Serial.printf("Dispositivo ignorado (tipo/direcao nao suportados): %s.\n",
                  device.name.c_str());
    return false;
  }
  return true;
}

static void initializeDevice(Device &device) {
  if (isOutput(device)) {
    // Prepara o nivel inativo antes de habilitar a saida para evitar pulso na partida.
    digitalWrite(device.pin, device.activeLow ? HIGH : LOW);
    pinMode(device.pin, OUTPUT);
    writeRelay(device, false);
  } else {
    pinMode(device.pin, INPUT);
    device.hasRawState = false;
  }
  device.configured = true;
  device.appliedStateValid = false;
  device.hasReportedState = false;
}

static void synchronizeDevices(JsonArrayConst deviceList) {
  for (Device &device : devices) device.seen = false;

  for (JsonObjectConst item : deviceList) {
    Device incoming;
    if (!readDevice(item, incoming)) continue;

    Device *existing = nullptr;
    for (Device &device : devices) {
      if (device.id == incoming.id) {
        existing = &device;
        break;
      }
    }

    if (!existing) {
      devices.push_back(incoming);
      Device &added = devices.back();
      initializeDevice(added);
      added.seen = true;
      Serial.printf("Configurado: %s (%s, GPIO %u).\n", added.name.c_str(),
                    added.type.c_str(), added.pin);
      continue;
    }

    const bool changed = existing->pin != incoming.pin ||
                         existing->type != incoming.type ||
                         existing->direction != incoming.direction ||
                         existing->activeLow != incoming.activeLow ||
                         existing->activeHigh != incoming.activeHigh ||
                         existing->debounceMs != incoming.debounceMs ||
                         existing->holdMs != incoming.holdMs;
    if (changed) {
      releaseDevice(*existing);
      const bool wasReported = existing->hasReportedState;
      const float lastReported = existing->lastReportedState;
      *existing = incoming;
      initializeDevice(*existing);
      existing->hasReportedState = wasReported;
      existing->lastReportedState = lastReported;
    } else {
      existing->name = incoming.name;
    }
    existing->seen = true;
  }

  for (size_t index = 0; index < devices.size();) {
    if (devices[index].seen) {
      ++index;
      continue;
    }
    Serial.printf("Dispositivo removido da sala: %s.\n", devices[index].name.c_str());
    releaseDevice(devices[index]);
    devices.erase(devices.begin() + index);
  }
}

static bool reportState(Device &device, float value) {
  if (!deviceToken.length() || WiFi.status() != WL_CONNECTED) {
    device.nextReportAt = millis() + REPORT_RETRY_MS;
    return false;
  }

  const int deviceId = device.id;
  JsonDocument payload;
  payload["value"] = value;
  String body;
  serializeJson(payload, body);

  String response;
  const String path = "/devices/" + String(deviceId) + "/state";
  int status = requestApi("POST", path, body, deviceToken, response);
  if (status == HTTP_CODE_UNAUTHORIZED) {
    deviceToken = "";
    if (performHandshake())
      status = requestApi("POST", path, body, deviceToken, response);
  }

  if (status >= 200 && status < 300) {
    device.lastReportedState = value;
    device.hasReportedState = true;
    device.nextReportAt = millis() + REPORT_RETRY_MS;
    Serial.printf("Estado enviado: %s = %.2f\n", device.name.c_str(), value);
    return true;
  }
  Serial.printf("Falha ao enviar estado de %s (HTTP %d).\n",
                device.name.c_str(), status);
  device.nextReportAt = millis() + REPORT_RETRY_MS;
  return false;
}

static bool fetchCommands() {
  if (!deviceToken.length() && !performHandshake()) return false;
  String response;
  int status = requestApi("GET", "/commands", "", deviceToken, response);
  if (status == HTTP_CODE_UNAUTHORIZED) {
    deviceToken = "";
    if (!performHandshake()) return false;
    status = requestApi("GET", "/commands", "", deviceToken, response);
  }
  if (status != HTTP_CODE_OK) {
    Serial.printf("Consulta de dispositivos falhou (HTTP %d).\n", status);
    return false;
  }

  JsonDocument json;
  if (deserializeJson(json, response)) {
    Serial.println("Resposta de comandos retornou JSON invalido.");
    return false;
  }
  synchronizeDevices(json["devices"].as<JsonArrayConst>());

  for (Device &device : devices) {
    if (!device.configured || !isOutput(device)) continue;
    float state = 0.0f;
    for (JsonObjectConst item : json["devices"].as<JsonArrayConst>()) {
      if ((item["id"] | 0) == device.id) {
        JsonVariantConst desired = item["desired_state"];
        JsonVariantConst current = item["current_state"];
        if (!desired.isNull()) state = desired.as<float>();
        else if (!current.isNull()) state = current.as<float>();
        break;
      }
    }

    const bool active = state >= 0.5f;
    if (!device.appliedStateValid || (device.appliedState >= 0.5f) != active) {
      writeRelay(device, active);
      device.appliedState = active ? 1.0f : 0.0f;
      device.appliedStateValid = true;
      Serial.printf("Rele %s: %s\n", device.name.c_str(), active ? "ligado" : "desligado");
    }
    if ((!device.hasReportedState || device.lastReportedState != device.appliedState) &&
        millis() >= device.nextReportAt) {
      reportState(device, device.appliedState);
    }
  }
  return true;
}

static void samplePresenceSensors() {
  const uint32_t now = millis();
  for (Device &device : devices) {
    if (!device.configured || !isPresenceInput(device)) continue;

    const bool pinHigh = digitalRead(device.pin) == HIGH;
    const bool rawState = pinHigh == device.activeHigh;
    if (!device.hasRawState) {
      device.rawState = rawState;
      device.debouncedState = rawState;
      device.stableState = rawState;
      device.absencePending = false;
      device.rawChangedAt = now;
      device.hasRawState = true;
    } else if (rawState != device.rawState) {
      device.rawState = rawState;
      device.rawChangedAt = now;
    } else if (device.debouncedState != device.rawState &&
               now - device.rawChangedAt >= device.debounceMs) {
      device.debouncedState = device.rawState;
      if (device.debouncedState) {
        device.absencePending = false;
        if (!device.stableState) {
          device.stableState = true;
          Serial.printf("Presenca %s: detectada\n", device.name.c_str());
        }
      } else if (device.stableState && device.holdMs > 0) {
        device.absencePending = true;
        device.absenceStartedAt = now;
      } else if (device.stableState) {
        device.stableState = false;
        Serial.printf("Presenca %s: ausente\n", device.name.c_str());
      }
    }

    if (device.absencePending &&
        now - device.absenceStartedAt >= device.holdMs) {
      device.absencePending = false;
      device.stableState = false;
      Serial.printf("Presenca %s: ausente\n", device.name.c_str());
    }

    const float value = device.stableState ? 1.0f : 0.0f;
    if ((!device.hasReportedState || device.lastReportedState != value) &&
        now >= device.nextReportAt) {
      reportState(device, value);
    }
  }
}

static void checkSerialConfiguration() {
#if !ZEPHORA_STATIC_CONFIG
  if (!Serial.available()) return;
  const char command = static_cast<char>(Serial.read());
  if (command != 'c' && command != 'C') return;
  while (Serial.available()) Serial.read();
  deviceToken = "";
  nextHandshakeAttemptAt = 0;
  handshakeRetryDelayMs = HANDSHAKE_RETRY_INITIAL_MS;
  configureFromSerial(false);
#endif
}

void setup() {
  Serial.begin(115200);
  delay(250);
  WiFi.mode(WIFI_STA);
  loadConfiguration();
  Serial.printf("Zephora ESP32 iniciado. MAC usado no handshake: %s\n", deviceMac().c_str());
  Serial.println("Esperando Wi-Fi e sincronizando os dispositivos desta sala.");
  connectWifi();
}

void loop() {
  checkSerialConfiguration();
  connectWifi();
  if (WiFi.status() == WL_CONNECTED) {
    const uint32_t now = millis();
    if (now - lastCommandPollAt >= COMMAND_POLL_MS) {
      lastCommandPollAt = now;
      fetchCommands();
    }
  }
  samplePresenceSensors();
  delay(10);
}
