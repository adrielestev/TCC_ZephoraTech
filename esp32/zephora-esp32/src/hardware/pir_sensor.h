#pragma once
#include <Arduino.h>

#include "../core/channel.h"
#include "../core/presence_filter.h"

namespace zephora {

// Sensor de presença PIR (HC-SR501, AM312...). Saída digital: nível alto = movimento.
//  holdMs   : tempo sem movimento antes de informar "ausente" (evita a luz apagar com a pessoa parada)
//  warmupMs : aquecimento do sensor após ligar (HC-SR501: ~30–60 s) — leituras ignoradas
// Obs.: GPIO 34–39 só são entrada e não têm pull-up/pull-down internos (o PIR já aciona a linha).
class PirSensor : public Channel {
 public:
  PirSensor(const char* id, const char* name, uint8_t pin, uint32_t holdMs = 30000,
            uint32_t warmupMs = 45000, bool activeHigh = true)
      : id_(id), name_(name), pin_(pin), activeHigh_(activeHigh), filter_(holdMs, warmupMs) {}

  const char* id() const override { return id_; }
  const char* name() const override { return name_; }
  DeviceType type() const override { return DeviceType::PresenceSensor; }

  void begin() override { pinMode(pin_, INPUT); }
  void update(uint32_t nowMs) override {
    bool raw = (digitalRead(pin_) == HIGH) == activeHigh_;
    present_ = filter_.update(raw, nowMs);
  }
  bool state() const override { return present_; }

 private:
  const char *id_, *name_;
  uint8_t pin_;
  bool activeHigh_;
  PresenceFilter filter_;
  bool present_ = false;
};

}  // namespace zephora
