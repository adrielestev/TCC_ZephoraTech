/*
 * Zephora ESP32 firmware
 * Arduino-ESP32 core 3.x; Wokwi and physical ESP32 DevKit V1/DevKitC.
 * Configure the room in the Zephora app before connecting this device.
 */
#include <Arduino.h>
#include <ArduinoJson.h>
#include <DallasTemperature.h>
#include <HTTPClient.h>
#include <memory>
#include <OneWire.h>
#include <Preferences.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <esp_arduino_version.h>
#include <vector>

#if !defined(ESP_ARDUINO_VERSION_MAJOR) || ESP_ARDUINO_VERSION_MAJOR < 3
#error "Zephora ESP32 requires Arduino-ESP32 3.x (LEDC by GPIO)."
#endif

#if __has_include("config.h")
#include "config.h"
#endif

// --- Local project configuration -------------------------------------------
#ifndef WIFI_SSID
#define WIFI_SSID "Wokwi-GUEST"
#endif
#ifndef WIFI_PASSWORD
#define WIFI_PASSWORD ""
#endif
#ifndef WIFI_CHANNEL
#define WIFI_CHANNEL 6  // Set to 0 for a physical Wi-Fi router.
#endif
#ifndef API_BASE_URL
#define API_BASE_URL "http://host.wokwi.internal:3000"
#endif
#ifndef DEVICE_CREDENTIAL
#define DEVICE_CREDENTIAL "PASTE_A_CREDENCIAL_DA_SALA_AQUI"
#endif
#ifndef DEVICE_MAC_OVERRIDE
#define DEVICE_MAC_OVERRIDE ""  // Empty uses Wi-Fi MAC (real board or Wokwi).
#endif
#ifndef API_ROOT_CA
#define API_ROOT_CA ""  // HTTPS requires the trusted root CA certificate.
#endif

static constexpr uint32_t COMMAND_POLL_MS = 2000;
static constexpr uint32_t WIFI_RETRY_MS = 5000;
static constexpr uint32_t HTTP_TIMEOUT_MS = 6000;
static constexpr uint32_t TEMPERATURE_POLL_MS = 5000;
static constexpr uint32_t REPORT_RETRY_MS = 3000;
static constexpr uint8_t PWM_RESOLUTION_BITS = 12;
static constexpr uint8_t SERVO_RESOLUTION_BITS = 16;
static constexpr char WOKWI_DEFAULT_MAC[] = "24:0A:C4:00:01:10";

struct Device {
  String key;
  String type;
  String direction;
  String control;
  uint8_t pin = 0;
  bool inverted = false;
  bool configured = false;
  bool initialized = false;
  bool hasRawState = false;
  bool hasReportedState = false;
  bool rawState = false;
  bool stableState = false;
  bool appliedStateValid = false;
  float appliedState = 0;
  float lastReportedState = 0;
  float minPercent = 0;
  float maxPercent = 100;
  float minAngle = 0;
  float maxAngle = 180;
  uint32_t stepPercent = 5;
  uint32_t frequencyHz = 5000;
  uint32_t debounceMs = 50;
  uint32_t holdMs = 0;
  uint32_t rawChangedAt = 0;
  uint32_t nextReportAt = 0;
  uint32_t holdUntil = 0;
  uint8_t temperatureIndex = 0;
  uint8_t pwmBits = 0;
  uint32_t pwmFrequency = 0;
  bool seenInLastSync = false;
};

struct TemperatureBus {
  uint8_t pin;
  uint8_t nextIndex = 0;
  uint32_t lastReadAt = 0;
  std::unique_ptr<OneWire> wire;
  std::unique_ptr<DallasTemperature> sensor;

  explicit TemperatureBus(uint8_t dataPin)
      : pin(dataPin), wire(new OneWire(dataPin)),
        sensor(new DallasTemperature(wire.get())) {
    sensor->begin();
    sensor->setWaitForConversion(false);
    sensor->requestTemperatures();
    lastReadAt = millis();
  }
};

static std::vector<Device> devices;
static std::vector<std::unique_ptr<TemperatureBus>> temperatureBuses;
static String deviceToken;
static String wifiSsid;
static String wifiPassword;
static String apiBaseUrl;
static String deviceCredential;
static String deviceMacOverride;
static Preferences preferences;
static uint32_t lastCommandPollAt = 0;
static uint32_t nextWifiRetryAt = 0;
static bool missingCredentialLogged = false;

static String normalizeMac(String mac);

static String readSerialValue(const char *prompt, const String &current = "") {
  Serial.print(prompt);
  if (current.length()) Serial.print(" [Enter mantém o valor atual]");
  Serial.println();
  String value;
  while (true) {
    while (Serial.available()) {
      const char ch = static_cast<char>(Serial.read());
      if (ch == '\n') {
        if (value == "<vazio>") return "";
        return value.length() ? value : current;
      }
      if (ch == '\r') continue;
      if (ch >= 32 && ch <= 126) {
        value += ch;
      }
    }
    delay(10);
  }
}

static void configureFromSerial(bool firstSetup) {
  Serial.println("\n=== Configuração Zephora ===");
  Serial.printf("MAC Wi-Fi desta placa: %s\n", normalizeMac(WiFi.macAddress()).c_str());
  Serial.println("Cadastre este MAC na sala do aplicativo.");
  wifiSsid = readSerialValue("Nome da rede Wi-Fi (SSID):", firstSetup ? "" : wifiSsid);
  wifiPassword = readSerialValue("Senha do Wi-Fi (vazia = rede aberta):", firstSetup ? "" : wifiPassword);
  deviceCredential = readSerialValue("Credencial do dispositivo gerada no aplicativo:", firstSetup ? "" : deviceCredential);
  preferences.putString("ssid", wifiSsid);
  preferences.putString("wifi_pass", wifiPassword);
  preferences.putString("credential", deviceCredential);
  Serial.println("Configuração salva na memória do ESP32. Reinicie para conectar.");
}

static void loadConfiguration() {
  preferences.begin("zephora", false);
  const bool configured = preferences.getBool("configured", false);
  wifiSsid = preferences.getString("ssid", "");
  wifiPassword = preferences.getString("wifi_pass", "");
  deviceCredential = preferences.getString("credential", "");
  apiBaseUrl = API_BASE_URL;
  deviceMacOverride = DEVICE_MAC_OVERRIDE;
  if (!configured || !wifiSsid.length() || !deviceCredential.length()) {
    configureFromSerial(true);
    preferences.putBool("configured", true);
    return;
  }

  Serial.println("Pressione 'c' e Enter no Monitor Serial em até 5 segundos para reconfigurar.");
  const uint32_t startedAt = millis();
  while (millis() - startedAt < 5000) {
    if (Serial.available() && Serial.read() == 'c') {
      configureFromSerial(false);
      return;
    }
    delay(10);
  }
}

static String normalizeMac(String mac) {
  mac.toUpperCase();
  return mac;
}

static String deviceMac() {
  if (deviceMacOverride.length()) return normalizeMac(deviceMacOverride);
  return normalizeMac(WiFi.macAddress());
}

static String apiUrl(const String &path) {
  String base = apiBaseUrl;
  while (base.endsWith("/")) base.remove(base.length() - 1);
  return base + path;
}

static bool connectWifi() {
  if (WiFi.status() == WL_CONNECTED) return true;

  const uint32_t now = millis();
  if (now < nextWifiRetryAt) return false;
  nextWifiRetryAt = now + WIFI_RETRY_MS;
  Serial.printf("Wi-Fi: conectando a %s\n", wifiSsid.c_str());
  WiFi.mode(WIFI_STA);
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
  if (!http.begin(client, apiUrl(path))) {
    Serial.println("HTTP: não foi possível iniciar a conexão.");
    return -1;
  }

  http.addHeader("Accept", "application/json");
  if (method == "POST") http.addHeader("Content-Type", "application/json");
  if (handshake) {
    http.addHeader("X-Device-MAC", deviceMac());
    http.addHeader("X-Device-Credential", deviceCredential);
  } else if (bearer.length()) {
    http.addHeader("Authorization", "Bearer " + bearer);
  }

  const int status = method == "POST" ? http.POST(body) : http.GET();
  responseBody = status > 0 ? http.getString() : String();
  http.end();
  return status;
}

static int requestApi(const String &method, const String &path,
                      const String &body, const String &bearer,
                      String &responseBody, bool handshake = false) {
  const String url = apiUrl(path);
  if (url.startsWith("https://")) {
    if (API_ROOT_CA[0] == '\0') {
      Serial.println("HTTPS recusado: configure API_ROOT_CA com a CA confiável.");
      return -1;
    }
    WiFiClientSecure client;
    client.setCACert(API_ROOT_CA);
    return sendRequest(client, method, path, body, bearer, responseBody, handshake);
  }
  if (!url.startsWith("http://")) {
    Serial.println("API_BASE_URL deve começar com http:// ou https://.");
    return -1;
  }

  WiFiClient client;
  return sendRequest(client, method, path, body, bearer, responseBody, handshake);
}

static bool performHandshake() {
  if (!deviceCredential.length()) {
    if (!missingCredentialLogged) {
      Serial.println("Configure a credencial da sala pelo Monitor Serial.");
      missingCredentialLogged = true;
    }
    return false;
  }

  String response;
  const int status = requestApi("POST", "/device/handshake", "{}", "",
                                response, true);
  if (status != HTTP_CODE_OK) {
    Serial.printf("Handshake falhou (HTTP %d).\n", status);
    return false;
  }

  JsonDocument json;
  if (deserializeJson(json, response)) {
    Serial.println("Handshake: resposta JSON inválida.");
    return false;
  }
  const char *token = json["token"] | "";
  if (!token[0]) {
    Serial.println("Handshake: API não retornou token.");
    return false;
  }

  deviceToken = token;
  Serial.printf("ESP32 autenticado na sala %s (id %d).\n",
                json["room"]["name"] | "", json["room"]["id"] | 0);
  return true;
}

static bool isDigitalInput(const Device &device) {
  return device.direction == "INPUT" && device.control == "DIGITAL" &&
         device.type != "TEMPERATURE";
}

static bool isOutput(const Device &device) {
  return device.direction == "OUTPUT";
}

static bool pinCanDriveOutput(uint8_t pin) {
  // ESP32 classic: avoid flash pins, boot-strapping pins, UART pins and
  // GPIO 34-39, which are input-only. The project DB validates only 0-39.
  if (pin > 33 || (pin >= 6 && pin <= 11)) return false;
  switch (pin) {
    case 0: case 1: case 2: case 3: case 5: case 12: case 15: return false;
    default: return true;
  }
}

static bool isContactInput(const Device &device) {
  return device.type == "REED_SWITCH" || device.type == "CONTACT_SENSOR";
}

static void stopPwm(Device &device) {
  if (device.pwmBits) {
    ledcDetach(device.pin);
    device.pwmBits = 0;
    device.pwmFrequency = 0;
  }
}

static void releaseDevice(Device &device) {
  if (!device.initialized || !isOutput(device)) return;
  if (device.pwmBits) {
    stopPwm(device);
    pinMode(device.pin, INPUT);
  } else {
    digitalWrite(device.pin, device.inverted ? HIGH : LOW);
    pinMode(device.pin, INPUT);
  }
}

static void configureDevice(Device &device) {
  if (isOutput(device)) {
    if (!pinCanDriveOutput(device.pin)) {
      Serial.printf("GPIO %u recusado para saída de %s (pino reservado/incompatível).\n",
                    device.pin, device.key.c_str());
      device.configured = false;
      return;
    }
    if (device.control == "DIGITAL") {
      stopPwm(device);
      pinMode(device.pin, OUTPUT);
      digitalWrite(device.pin, device.inverted ? HIGH : LOW);
    } else {
      pinMode(device.pin, OUTPUT);
      device.configured = true;
      device.initialized = true;
      return;
    }
  } else if (isDigitalInput(device)) {
    stopPwm(device);
    pinMode(device.pin, isContactInput(device) ? INPUT_PULLUP : INPUT);
  } else if (device.type == "TEMPERATURE") {
    stopPwm(device);
    TemperatureBus *bus = nullptr;
    for (auto &candidate : temperatureBuses) {
      if (candidate->pin == device.pin) bus = candidate.get();
    }
    if (!bus) {
      temperatureBuses.emplace_back(new TemperatureBus(device.pin));
      bus = temperatureBuses.back().get();
    }
  }
  device.configured = true;
  device.initialized = true;
  device.hasRawState = false;
  device.hasReportedState = false;
  device.appliedStateValid = false;
}

static Device readDevice(JsonObjectConst json) {
  Device device;
  device.key = json["device_key"] | "";
  device.type = json["type"] | "";
  device.direction = json["direction"] | "";
  device.control = json["type_of_control"] | "";
  const int pin = json["pin"] | -1;
  if (pin >= 0 && pin <= 39) device.pin = static_cast<uint8_t>(pin);
  JsonObjectConst settings = json["device_settings"].as<JsonObjectConst>();
  device.inverted = settings["inverted"] | false;
  device.minPercent = settings["min_percent"] | 0.0f;
  device.maxPercent = settings["max_percent"] | 100.0f;
  device.minAngle = settings["min_angle"] | 0.0f;
  device.maxAngle = settings["max_angle"] | 180.0f;
  device.stepPercent = settings["step_percent"] | 5U;
  device.frequencyHz = settings["frequency_hz"] | 5000U;
  device.debounceMs = settings["debounce_ms"] | 50U;
  device.holdMs = settings["hold_ms"] | 0U;
  device.configured = true;
  return device;
}

static void synchronizeDevices(JsonArrayConst deviceList) {
  for (auto &device : devices) device.seenInLastSync = false;
  for (auto &bus : temperatureBuses) bus->nextIndex = 0;

  for (JsonObjectConst item : deviceList) {
    Device incoming = readDevice(item);
    if (!incoming.key.length() || !incoming.configured) continue;

    Device *existing = nullptr;
    for (auto &device : devices) {
      if (device.key == incoming.key) {
        existing = &device;
        break;
      }
    }

    if (!existing) {
      devices.push_back(incoming);
      configureDevice(devices.back());
      devices.back().seenInLastSync = true;
      if (devices.back().type == "TEMPERATURE") {
        for (auto &bus : temperatureBuses) {
          if (bus->pin == devices.back().pin) {
            devices.back().temperatureIndex = bus->nextIndex++;
          }
        }
      }
      continue;
    }

    const Device previous = *existing;
    const bool mustConfigure = !existing->initialized ||
        existing->pin != incoming.pin || existing->type != incoming.type ||
        existing->direction != incoming.direction || existing->control != incoming.control;
    incoming.initialized = existing->initialized;
    incoming.pwmBits = existing->pwmBits;
    incoming.pwmFrequency = existing->pwmFrequency;
    incoming.seenInLastSync = true;
    incoming.hasRawState = existing->hasRawState;
    incoming.rawState = existing->rawState;
    incoming.stableState = existing->stableState;
    incoming.rawChangedAt = existing->rawChangedAt;
    incoming.holdUntil = existing->holdUntil;
    incoming.hasReportedState = existing->hasReportedState;
    incoming.lastReportedState = existing->lastReportedState;
    incoming.nextReportAt = existing->nextReportAt;
    incoming.appliedStateValid = existing->appliedStateValid;
    incoming.appliedState = existing->appliedState;
    *existing = incoming;
    if (mustConfigure) {
      Device oldDevice = previous;
      releaseDevice(oldDevice);
      existing->initialized = false;
      existing->pwmBits = 0;
      existing->pwmFrequency = 0;
      configureDevice(*existing);
    }
    if (existing->type == "TEMPERATURE") {
      for (auto &bus : temperatureBuses) {
        if (bus->pin == existing->pin) existing->temperatureIndex = bus->nextIndex++;
      }
    }
  }

  for (size_t i = 0; i < devices.size();) {
    Device &device = devices[i];
    if (device.seenInLastSync) {
      ++i;
      continue;
    }
    if (isOutput(device)) {
      if (device.control == "DIGITAL") {
        digitalWrite(device.pin, device.inverted ? HIGH : LOW);
        pinMode(device.pin, INPUT);
      } else {
        stopPwm(device);
        pinMode(device.pin, INPUT);
      }
    }
    devices.erase(devices.begin() + i);
  }
}

static bool reportState(Device &device, float value) {
  if (!deviceToken.length() || WiFi.status() != WL_CONNECTED) return false;
  JsonDocument payload;
  payload["current_state"] = value;
  String body;
  serializeJson(payload, body);

  String response;
  const String path = "/device/sensors/" + device.key + "/state";
  int status = requestApi("POST", path, body, deviceToken, response);
  if (status == HTTP_CODE_UNAUTHORIZED) {
    deviceToken = "";
    if (performHandshake()) {
      status = requestApi("POST", path, body, deviceToken, response);
    }
  }

  if (status >= 200 && status < 300) {
    device.lastReportedState = value;
    device.hasReportedState = true;
    device.nextReportAt = millis() + REPORT_RETRY_MS;
    return true;
  }
  Serial.printf("Leitura de %s não enviada (HTTP %d).\n", device.key.c_str(), status);
  device.nextReportAt = millis() + REPORT_RETRY_MS;
  return false;
}

static bool ensurePwm(Device &device, uint32_t frequency, uint8_t bits) {
  if (device.pwmBits == bits && device.pwmFrequency == frequency) return true;
  stopPwm(device);
  if (!ledcAttach(device.pin, frequency, bits)) {
    Serial.printf("PWM não disponível no GPIO %u (%s).\n", device.pin, device.key.c_str());
    return false;
  }
  device.pwmBits = bits;
  device.pwmFrequency = frequency;
  return true;
}

static void applyOutput(Device &device, float requestedState) {
  if (!device.configured || !isOutput(device) || !isfinite(requestedState)) return;
  float state = constrain(requestedState, 0.0f, 100.0f);

  if (device.control == "DIGITAL") {
    state = state >= 0.5f ? 1.0f : 0.0f;
    const bool active = state > 0;
    const uint8_t level = (active != device.inverted) ? HIGH : LOW;
    digitalWrite(device.pin, level);
  } else if (device.type == "SERVO") {
    const float percent = state == 0 ? 0 : constrain(state, device.minPercent, device.maxPercent);
    const float normalized = (percent - device.minPercent) /
                             max(1.0f, device.maxPercent - device.minPercent);
    const float angle = device.minAngle + normalized * (device.maxAngle - device.minAngle);
    const uint32_t pulseUs = static_cast<uint32_t>(500 + (angle / 180.0f) * 2000.0f);
    if (!ensurePwm(device, 50, SERVO_RESOLUTION_BITS)) return;
    const uint32_t maxDuty = (1UL << SERVO_RESOLUTION_BITS) - 1;
    const uint32_t duty = (pulseUs * maxDuty) / 20000UL;
    ledcWrite(device.pin, duty);
  } else if (device.type == "PWM") {
    const float percent = state == 0 ? 0 : constrain(state, device.minPercent, device.maxPercent);
    float electricalPercent = device.inverted ? 100.0f - percent : percent;
    electricalPercent = constrain(electricalPercent, 0.0f, 100.0f);
    if (!ensurePwm(device, device.frequencyHz, PWM_RESOLUTION_BITS)) return;
    const uint32_t maxDuty = (1UL << PWM_RESOLUTION_BITS) - 1;
    ledcWrite(device.pin, static_cast<uint32_t>(electricalPercent * maxDuty / 100.0f));
  } else {
    Serial.printf("Saída %s: tipo %s não implementado.\n",
                  device.key.c_str(), device.type.c_str());
    return;
  }

  if (!device.appliedStateValid || fabsf(state - device.appliedState) >= 0.01f) {
    device.appliedState = state;
    device.appliedStateValid = true;
    reportState(device, state);
  }
}

static bool fetchCommands() {
  if (!deviceToken.length() && !performHandshake()) return false;

  String response;
  int status = requestApi("GET", "/device/commands", "", deviceToken, response);
  if (status == HTTP_CODE_UNAUTHORIZED) {
    deviceToken = "";
    if (!performHandshake()) return false;
    status = requestApi("GET", "/device/commands", "", deviceToken, response);
  }
  if (status != HTTP_CODE_OK) {
    Serial.printf("Consulta de comandos falhou (HTTP %d).\n", status);
    return false;
  }

  JsonDocument json;
  if (deserializeJson(json, response)) {
    Serial.println("Comandos: resposta JSON inválida.");
    return false;
  }
  synchronizeDevices(json["devices"].as<JsonArrayConst>());

  JsonArrayConst commands = json["commands"].as<JsonArrayConst>();
  for (JsonObjectConst command : commands) {
    const String key = command["device_key"] | "";
    const float state = command["current_state"] | 0.0f;
    for (auto &device : devices) {
      if (device.key == key) {
        applyOutput(device, state);
        break;
      }
    }
  }
  return true;
}

static void readDigitalInputs() {
  const uint32_t now = millis();
  for (auto &device : devices) {
    if (!device.configured || !isDigitalInput(device)) continue;

    const bool pinHigh = digitalRead(device.pin) == HIGH;
    const bool activeLevel = isContactInput(device) ? !pinHigh : pinHigh;
    const bool active = activeLevel != device.inverted;
    if (!device.hasRawState || active != device.rawState) {
      device.rawState = active;
      device.rawChangedAt = now;
      device.hasRawState = true;
      continue;
    }

    if (device.stableState != device.rawState &&
        now - device.rawChangedAt >= device.debounceMs) {
      device.stableState = device.rawState;
      if (device.type == "PIR_SENSOR" && device.stableState && device.holdMs) {
        device.holdUntil = now + device.holdMs;
      }
    }

    bool reportedState = device.stableState;
    if (device.type == "PIR_SENSOR" && !reportedState && now < device.holdUntil) {
      reportedState = true;
    }
    const float value = reportedState ? 1.0f : 0.0f;
    if ((!device.hasReportedState || value != device.lastReportedState) &&
        now >= device.nextReportAt) {
      reportState(device, value);
    }
  }
}

static void readTemperatureSensors() {
  const uint32_t now = millis();
  for (auto &bus : temperatureBuses) {
    if (now - bus->lastReadAt < TEMPERATURE_POLL_MS) continue;

    for (auto &device : devices) {
      if (!device.configured || device.type != "TEMPERATURE" || device.pin != bus->pin) continue;
      const float value = bus->sensor->getTempCByIndex(device.temperatureIndex);
      if (value == DEVICE_DISCONNECTED_C || value < -40.0f || value > 125.0f) continue;
      if ((!device.hasReportedState || fabsf(value - device.lastReportedState) >= 0.1f) &&
          now >= device.nextReportAt) {
        reportState(device, value);
      }
    }
    bus->sensor->requestTemperatures();
    bus->lastReadAt = now;
  }
}

void setup() {
  Serial.begin(115200);
  delay(250);
  WiFi.mode(WIFI_STA);
  loadConfiguration();
  Serial.printf("Zephora ESP32 iniciado. MAC Wi-Fi: %s\n", deviceMac().c_str());
  Serial.printf("Para Wokwi, cadastre a sala com MAC %s.\n", WOKWI_DEFAULT_MAC);
  connectWifi();
}

void loop() {
  connectWifi();
  if (WiFi.status() != WL_CONNECTED) {
    readDigitalInputs();
    delay(20);
    return;
  }

  const uint32_t now = millis();
  if (now - lastCommandPollAt >= COMMAND_POLL_MS) {
    lastCommandPollAt = now;
    fetchCommands();
  }
  readDigitalInputs();
  readTemperatureSensors();
  delay(10);
}
