#pragma once

#include <Arduino.h>

inline bool outputPinAllowed(uint8_t pin) {
  if (pin > 33 || (pin >= 6 && pin <= 11)) return false;
  // Evita UART e pinos de boot no ESP32 DevKit classico.
  switch (pin) {
    case 0: case 1: case 2: case 3: case 5: case 12: case 15: return false;
    default: return true;
  }
}

inline bool inputPinAllowed(uint8_t pin) {
  if (pin > 39 || (pin >= 6 && pin <= 11)) return false;
  switch (pin) {
    case 0: case 1: case 2: case 3: case 5: case 12: case 15: return false;
    default: return true;
  }
}
