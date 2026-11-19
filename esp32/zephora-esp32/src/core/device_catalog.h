#pragma once
// Catálogo de tipos de aparelho — espelho de modules/devices/device-types.js do backend.
// Novo tipo: 1) inclua aqui; 2) inclua no backend (device-types.js + CHECK de devices.type).
#include <stdint.h>
#include <string.h>

namespace zephora {

enum class DeviceType : uint8_t { Light, PresenceSensor, TemperatureSensor };

struct TypeInfo {
  DeviceType type;
  const char* wireName;   // valor do campo "type" no protocolo
  const char* stateKey;   // única chave do objeto "state" (booleana)
  bool controllable;      // aceita comandos do servidor
};

inline const TypeInfo& typeInfo(DeviceType t) {
  static constexpr TypeInfo kTypes[] = {
      {DeviceType::Light, "light", "on", true},
      {DeviceType::PresenceSensor, "presence_sensor", "presence", false},
      {DeviceType::TemperatureSensor, "temperature_sensor", "temperature", false},
  };
  return kTypes[static_cast<uint8_t>(t)];
}

}  // namespace zephora
