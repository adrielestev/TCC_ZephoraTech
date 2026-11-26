// Controla uma luz conectada a um módulo relé.
#pragma once
#include <Arduino.h>

#include "../core/channel.h"

namespace zephora {

// Luz comandada por módulo relé. A maioria dos módulos relé de 1/2/4/8 canais é ativa em nível BAIXO
// (activeLow = true). Na inicialização o relé sempre começa DESLIGADO, sem "tranco" no pino.
class RelayLight : public Channel {
 public:
  RelayLight(const char* id, const char* name, uint8_t pin, bool activeLow = true)
      : id_(id), name_(name), pin_(pin), activeLow_(activeLow) {}

  const char* id() const override { return id_; }
  const char* name() const override { return name_; }
  DeviceType type() const override { return DeviceType::Light; }

  void begin() override {
    digitalWrite(pin_, offLevel());  // define o nível ANTES de virar saída
    pinMode(pin_, OUTPUT);
    on_ = false;
  }
  bool state() const override { return on_; }
  bool setState(bool value) override {
    on_ = value;
    digitalWrite(pin_, value ? onLevel() : offLevel());
    return true;
  }

 private:
  uint8_t onLevel() const { return activeLow_ ? LOW : HIGH; }
  uint8_t offLevel() const { return activeLow_ ? HIGH : LOW; }
  const char *id_, *name_;
  uint8_t pin_;
  bool activeLow_, on_ = false;
};

}  // namespace zephora
