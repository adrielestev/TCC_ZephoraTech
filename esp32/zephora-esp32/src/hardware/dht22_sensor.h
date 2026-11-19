#pragma once
#include <Arduino.h>
#include <DHT.h>

#include "../core/channel.h"

namespace zephora {

class Dht22Sensor : public Channel {
 public:
  Dht22Sensor(const char* id, const char* name, uint8_t pin) : id_(id), name_(name), dht_(pin, DHT22) {}

  const char* id() const override { return id_; }
  const char* name() const override { return name_; }
  DeviceType type() const override { return DeviceType::TemperatureSensor; }

  void begin() override { dht_.begin(); }

  void update(uint32_t nowMs) override {
    if (nowMs - lastReadMs_ < kReadIntervalMs) return;
    lastReadMs_ = nowMs;
    const float reading = dht_.readTemperature();
    if (!isnan(reading)) temperatureC_ = reading;
  }

  bool state() const override { return false; }
  void writeState(JsonObject state) const override { state["temperature"] = temperatureC_; }

 private:
  static constexpr uint32_t kReadIntervalMs = 2000;
  const char* id_;
  const char* name_;
  DHT dht_;
  float temperatureC_ = 0.0F;
  uint32_t lastReadMs_ = 0;
};

}  // namespace zephora
