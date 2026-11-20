#pragma once
#include <Arduino.h>

#include "../core/channel.h"
#include "../core/presence_filter.h"
#include "../platform/settings_store.h"

namespace zephora {

// Sensor de presença PIR (HC-SR501, AM312...). Saída digital: nível alto = movimento.
//  holdMs   : tempo sem movimento antes de informar "ausente" (evita a luz apagar com a pessoa parada)
//  warmupMs : aquecimento do sensor após ligar (HC-SR501: ~30–60 s) — leituras ignoradas
// Obs.: GPIO 34–39 só são entrada e não têm pull-up/pull-down internos (o PIR já aciona a linha).
class PirSensor : public Channel {
 public:
  PirSensor(const char* id, const char* name, uint8_t pin, uint32_t holdMs = 30000,
            uint32_t warmupMs = 45000, bool activeHigh = true)
      : id_(id), name_(name), pin_(pin), activeHigh_(activeHigh),
        filter_(holdMs, warmupMs), holdMs_(holdMs), warmupMs_(warmupMs) {}

  const char* id() const override { return id_; }
  const char* name() const override { return name_; }
  DeviceType type() const override { return DeviceType::PresenceSensor; }

  void begin() override { pinMode(pin_, INPUT); }
  void update(uint32_t nowMs) override {
    bool raw = (digitalRead(pin_) == HIGH) == activeHigh_;
    present_ = filter_.update(raw, nowMs);
  }
  bool state() const override { return present_; }
  bool setExecutionConfig(JsonObjectConst config) override {
    if (config.size() != 2 ||
        !config["holdMs"].is<uint32_t>() ||
        !config["warmupMs"].is<uint32_t>())
      return false;
    uint32_t holdMs = config["holdMs"].as<uint32_t>();
    uint32_t warmupMs = config["warmupMs"].as<uint32_t>();
    if (holdMs > 3600000 || warmupMs > 600000)
      return false;
    bool changed = holdMs_ != holdMs || warmupMs_ != warmupMs;
    holdMs_ = holdMs;
    warmupMs_ = warmupMs;
    filter_.setConfig(holdMs, warmupMs);
    if (changed) {
      char json[64];
      snprintf(json, sizeof(json), "{\"holdMs\":%lu,\"warmupMs\":%lu}",
               static_cast<unsigned long>(holdMs),
               static_cast<unsigned long>(warmupMs));
      settings::saveChannelExecutionConfig(id_, json);
    }
    return true;
  }

 private:
  const char *id_, *name_;
  uint8_t pin_;
  bool activeHigh_;
  PresenceFilter filter_;
  uint32_t holdMs_ = 30000;
  uint32_t warmupMs_ = 45000;
  bool present_ = false;
};

}  // namespace zephora
