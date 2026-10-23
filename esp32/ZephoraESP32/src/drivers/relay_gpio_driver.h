#pragma once

#include <Arduino.h>
#include <ArduinoJson.h>
#include "../device_model.h"
#include "gpio_pin_rules.h"

inline bool configureRelayGpio(Device &device, JsonObjectConst config) {
  device.activeLow = config["active_low"] | false;
  return outputPinAllowed(device.pin);
}

inline void beginRelayGpio(Device &device) {
  // Prepara o nivel inativo antes de habilitar a saida para evitar pulso na partida.
  digitalWrite(device.pin, device.activeLow ? HIGH : LOW);
  pinMode(device.pin, OUTPUT);
  digitalWrite(device.pin, device.activeLow ? HIGH : LOW);
}

inline void endRelayGpio(Device &device) {
  digitalWrite(device.pin, device.activeLow ? HIGH : LOW);
  pinMode(device.pin, INPUT);
}

inline void writeRelayGpio(Device &device, float value) {
  const bool active = value >= 0.5f;
  const uint8_t level = (active != device.activeLow) ? HIGH : LOW;
  digitalWrite(device.pin, level);
}
