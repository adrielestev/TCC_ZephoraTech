#pragma once
#include <stdint.h>

#include <ArduinoJson.h>

#include "device_catalog.h"

namespace zephora {

// Um "canal" é um aparelho físico ligado ao ESP32 (relé, sensor...).
// As implementações concretas ficam em src/hardware/ e são montadas em hardware_setup.cpp.
class Channel {
 public:
  virtual ~Channel() = default;

  virtual const char* id() const = 0;     // ex.: "relay_1" — [A-Za-z0-9_-]{1,32}, único no módulo
  virtual const char* name() const = 0;   // nome mostrado ao admin (até 60 caracteres)
  virtual DeviceType type() const = 0;

  virtual void begin() {}                 // configura pinos
  virtual void update(uint32_t /*nowMs*/) {}  // chamado a cada volta do loop (leitura de sensores)
  virtual bool state() const = 0;         // estado atual (on / presence)
  virtual void writeState(JsonObject state) const { state[typeInfo(type()).stateKey] = this->state(); }
  virtual bool setState(bool /*value*/) { return false; }  // só aparelhos controláveis
  virtual bool setExecutionConfig(JsonObjectConst /*config*/) { return false; }  // parâmetros específicos por aparelho
};

}  // namespace zephora
