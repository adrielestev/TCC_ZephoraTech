// Firmware principal do ESP32: configura aparelhos, conecta à rede e sincroniza estados e comandos com a API.
// Zephora — firmware padrão do módulo ESP32.
// Fluxo (igual ao fluxograma "Admin: cadastro de ESP32 e aparelhos"):
//   1) 1º boot: gera a credencial única e abre o portal "Zephora-XXXXXX" (Wi-Fi + endereço do servidor);
//   2) o admin cola a credencial no app (POST /api/esp32) e o módulo passa a sincronizar;
//   3) a 1ª sincronização (POST /api/device-sync) torna o módulo "online" e revela os aparelhos;
//   4) a cada ciclo: envia o estado dos aparelhos e executa os comandos recebidos.
#include <Arduino.h>
#include <ArduinoJson.h>
#include <WiFi.h>
#include <time.h>

#include "../include/config.h"
#include "core/channel_registry.h"
#include "core/server_url.h"
#include "core/sync_protocol.h"
#include "core/sync_scheduler.h"
#include "hardware/hardware_setup.h"
#include "platform/config_portal.h"
#include "platform/log.h"
#include "platform/settings_store.h"
#include "platform/status_led.h"
#include "platform/sync_client.h"

using namespace zephora;

namespace {

Settings gSettings;
ChannelRegistry gRegistry;
SyncScheduler gScheduler;
ServerUrl gServer;

bool gClockRequested = false;
uint32_t gLastWifiBeginMs = 0;
uint32_t gOfflineSinceMs = 0;
bool gWasConnected = false;
LedMode gSyncLed = LedMode::Connecting;
int gLastLoggedStatus = 0;

// Botão BOOT: solte entre 3 s e 15 s = portal; segure 15 s = restaurar de fábrica
bool gButtonDown = false;
uint32_t gButtonSinceMs = 0;

void beginWifi() {
  WiFi.begin(gSettings.ssid.c_str(), gSettings.wifiPassword.empty() ? nullptr : gSettings.wifiPassword.c_str());
  gLastWifiBeginMs = millis();
  ZLOG("Conectando ao Wi-Fi \"%s\"...", gSettings.ssid.c_str());
}

void maintainWifi(uint32_t now) {
  bool connected = WiFi.status() == WL_CONNECTED;
  if (connected) {
    if (!gWasConnected) {
      ZLOG("Wi-Fi conectado, IP %s", WiFi.localIP().toString().c_str());
      gWasConnected = true;
      gScheduler.reset(now);
      if (gServer.https && !gClockRequested) {  // HTTPS precisa do relógio para validar o certificado
        configTime(0, 0, "pool.ntp.org", "time.google.com");
        gClockRequested = true;
      }
    }
    gOfflineSinceMs = 0;
    return;
  }
  if (gWasConnected) { ZLOG("Wi-Fi caiu"); gWasConnected = false; }
  if (gOfflineSinceMs == 0) gOfflineSinceMs = now ? now : 1;
  // Wi-Fi fora por muito tempo: reinicia o módulo (recupera estados raros da pilha de rede)
  if (now - gOfflineSinceMs > config::kWifiRestartAfterOfflineMs) {
    ZLOG("Sem Wi-Fi há muito tempo: reiniciando");
    ESP.restart();
  }
  if (now - gLastWifiBeginMs > config::kWifiConnectTimeoutMs) beginWifi();
}

bool clockReady() {
  if (!gServer.https) return true;
  return time(nullptr) >= config::kMinValidEpoch;
}

void doSync(uint32_t now) {
  std::string payload = buildSyncPayload(gRegistry, ZEPHORA_FIRMWARE_VERSION);
  HttpResult res = postSync(gServer, gSettings.credential, payload);

  if (res.status == 200) {
    gRegistry.commitReported();  // o servidor já tem o estado enviado (antes de aplicar comandos)
    SyncResponse sr = handleSyncResponse(res.body.data(), res.body.size(), gRegistry);
    if (sr.valid) {
      if (gLastLoggedStatus != 200) ZLOG("Sincronizado com o servidor");
      if (sr.applied || sr.rejected) ZLOG("Comandos: %u aplicados, %u ignorados", sr.applied, sr.rejected);
      gLastLoggedStatus = 200;
      gSyncLed = LedMode::Online;
      gScheduler.onSuccess(now, sr.pollIntervalMs, sr.applied > 0);
      return;
    }
    res.status = 502;  // 200 com corpo ilegível: trata como falha do servidor
  }

  FailureKind kind = classifyFailure(res);
  if (res.status != gLastLoggedStatus) {  // loga só quando o resultado muda (sem inundar a serial)
    if (res.status <= 0) ZLOG("Falha de comunicação: %s", res.problem ? res.problem : "erro");
    else if (res.status == 401) ZLOG("Credencial não reconhecida: cadastre este módulo no app (Administração › Módulos ESP32)");
    else if (res.status == 404) ZLOG("Servidor respondeu 404: confira o endereço configurado no portal");
    else ZLOG("Servidor respondeu HTTP %d", res.status);
    gLastLoggedStatus = res.status;
  }
  gSyncLed = (kind == FailureKind::Auth) ? LedMode::Attention : LedMode::Error;
  gScheduler.onFailure(now, kind, res.retryAfterMs);
}

void handleButton(uint32_t now) {
  if (config::kButtonPin < 0) return;
  bool down = digitalRead(config::kButtonPin) == LOW;
  if (down && !gButtonDown) { gButtonDown = true; gButtonSinceMs = now; }
  if (down && gButtonDown && now - gButtonSinceMs >= config::kPortalHoldMs) status_led::set(LedMode::Button);
  if (!down && gButtonDown) {
    uint32_t held = now - gButtonSinceMs;
    gButtonDown = false;
    if (held >= config::kFactoryResetHoldMs) {
      ZLOG("Restaurando de fábrica");
      settings::factoryReset();
      delay(config::kRebootDelayMs);
      ESP.restart();
    } else if (held >= config::kPortalHoldMs) {
      ZLOG("Abrindo o portal de configuração");
      settings::requestPortal();
      delay(config::kRebootDelayMs);
      ESP.restart();
    }
  }
  // Segurou 15 s sem soltar: restaura sem esperar
  if (down && gButtonDown && now - gButtonSinceMs >= config::kFactoryResetHoldMs) {
    ZLOG("Restaurando de fábrica");
    settings::factoryReset();
    delay(config::kRebootDelayMs);
    ESP.restart();
  }
}

}  // namespace

void setup() {
  Serial.begin(115200);
  delay(200);
  status_led::begin();
  if (config::kButtonPin >= 0) pinMode(config::kButtonPin, INPUT_PULLUP);

  // Aparelhos primeiro: relés começam desligados mesmo se o portal abrir
  hardwareSetup(gRegistry);
  for (size_t i = 0; i < gRegistry.size(); ++i) gRegistry.at(i).begin();

  settings::load(gSettings);
  for (size_t i = 0; i < gRegistry.size(); ++i) {
    Channel& channel = gRegistry.at(i);
    if (channel.type() != DeviceType::PresenceSensor) continue;
    std::string executionJson;
    if (!settings::loadChannelExecutionConfig(channel.id(), executionJson)) continue;
    JsonDocument execution;
    if (deserializeJson(execution, executionJson) == DeserializationError::Ok &&
        execution.is<JsonObjectConst>())
      channel.setExecutionConfig(execution.as<JsonObjectConst>());
  }
#ifdef ZEPHORA_DEV_SERVER_URL
  // Só no ambiente de simulação (Wokwi): sem portal, Wi-Fi/servidor já vêm gravados no build
  if (gSettings.ssid.empty() || gSettings.serverUrl.empty())
    settings::saveNetwork(gSettings, ZEPHORA_DEV_WIFI_SSID, ZEPHORA_DEV_WIFI_PASSWORD, ZEPHORA_DEV_SERVER_URL);
#endif
#ifdef ZEPHORA_DEV_CREDENTIAL
  settings::saveCredential(gSettings, ZEPHORA_DEV_CREDENTIAL);
#endif
  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);  // rádio ligado => gerador de números aleatórios de verdade
  WiFi.setSleep(false);
  settings::ensureCredential(gSettings);

  Serial.println();
  Serial.println("=== Zephora ESP32 ===");
  Serial.printf("Firmware %s | %u aparelho(s)\n", ZEPHORA_FIRMWARE_VERSION, static_cast<unsigned>(gRegistry.size()));
  Serial.printf("Credencial deste módulo: %s\n", gSettings.credential.c_str());

  bool serverOk = parseServerUrl(gSettings.serverUrl, gServer);
  bool configured = !gSettings.ssid.empty() && serverOk;
  bool forcePortal = settings::takePortalRequest();
  if (!configured || forcePortal) portal::run(gSettings, configured);  // não retorna

  status_led::set(LedMode::Connecting);
  beginWifi();
  gScheduler.reset(millis());
}

void loop() {
  uint32_t now = millis();

  handleButton(now);
  for (size_t i = 0; i < gRegistry.size(); ++i) gRegistry.at(i).update(now);
  maintainWifi(now);

  if (gRegistry.changedSinceReport()) gScheduler.onLocalChange(now);

  bool connected = WiFi.status() == WL_CONNECTED;
  if (connected && clockReady() && gScheduler.due(now)) doSync(now);

  if (!gButtonDown || now - gButtonSinceMs < config::kPortalHoldMs)
    status_led::set(!connected || !clockReady() ? LedMode::Connecting : gSyncLed);
  status_led::update(now);
  delay(2);
}
