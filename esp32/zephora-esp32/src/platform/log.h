#pragma once
#include <Arduino.h>
// Log na serial (115200). Nunca registra a credencial, exceto no banner de inicialização.
#define ZLOG(fmt, ...) Serial.printf("[%7lu] " fmt "\n", static_cast<unsigned long>(millis()), ##__VA_ARGS__)
