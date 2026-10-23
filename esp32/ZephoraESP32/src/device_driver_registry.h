#pragma once

#include <ArduinoJson.h>
#include "device_model.h"
#include "drivers/pir_gpio_driver.h"
#include "drivers/relay_gpio_driver.h"

enum class DriverInputMode {
  None,
  DebouncedPresence,
  SampledValue,
};

struct DeviceDriver {
  const char *id;
  const char *type;
  const char *direction;
  bool (*configure)(Device &, JsonObjectConst);
  void (*begin)(Device &);
  void (*end)(Device &);
  bool (*readInput)(Device &, float &);
  void (*writeOutput)(Device &, float);
  DriverInputMode inputMode;
  uint32_t sampleIntervalMs;
  float reportThreshold;
};

// Registre novos drivers nesta lista. Cada driver declara seu tipo/direcao e
// encapsula parsing da configuracao, validacao do GPIO e acesso ao hardware.
inline const DeviceDriver DEVICE_DRIVERS[] = {
    {"relay_gpio", "relay", "output", configureRelayGpio, beginRelayGpio,
     endRelayGpio, nullptr, writeRelayGpio, DriverInputMode::None, 0, 0},
    {"pir_gpio", "presence", "input", configurePirGpio, beginPirGpio,
     endPirGpio, readPirGpio, nullptr, DriverInputMode::DebouncedPresence, 0, 0},
};

inline const DeviceDriver *findDeviceDriver(const String &type,
                                           const String &direction) {
  for (const DeviceDriver &driver : DEVICE_DRIVERS) {
    if (type == driver.type && direction == driver.direction) return &driver;
  }
  return nullptr;
}

inline const DeviceDriver *findDeviceDriver(const Device &device) {
  return findDeviceDriver(device.type, device.direction);
}

inline bool isOutput(const Device &device) {
  const DeviceDriver *driver = findDeviceDriver(device);
  return driver && driver->writeOutput;
}

