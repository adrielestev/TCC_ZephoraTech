#include "status_led.h"

#include <Arduino.h>

#include "../../include/config.h"

namespace zephora::status_led {

static LedMode mode_ = LedMode::Connecting;

void begin() {
  if (config::kStatusLedPin < 0) return;
  pinMode(config::kStatusLedPin, OUTPUT);
  digitalWrite(config::kStatusLedPin, LOW);
}

void set(LedMode m) { mode_ = m; }

static bool level(uint32_t t) {
  switch (mode_) {
    case LedMode::Portal:     return (t % 300) < 150;
    case LedMode::Connecting: return (t % 2000) < 1000;
    case LedMode::Online:     return (t % 5000) < 60;
    case LedMode::Attention: { uint32_t p = t % 2000; return p < 100 || (p >= 250 && p < 350); }
    case LedMode::Error:      return (t % 1000) < 900;
    case LedMode::Button:     return true;
    default:                  return false;
  }
}

void update(uint32_t nowMs) {
  if (config::kStatusLedPin < 0) return;
  digitalWrite(config::kStatusLedPin, level(nowMs) ? HIGH : LOW);
}

}  // namespace zephora::status_led
