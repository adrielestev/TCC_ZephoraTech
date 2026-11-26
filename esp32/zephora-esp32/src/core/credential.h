// Cria e valida a credencial única do módulo ESP32.
#pragma once
// Credencial única do ESP32: a API aceita 32–128 caracteres [A-Za-z0-9_-].
// Geramos 32 bytes aleatórios em hexadecimal (64 caracteres).
#include <stddef.h>
#include <stdint.h>

#include <string>

namespace zephora {

inline std::string credentialFromBytes(const uint8_t* bytes, size_t n) {
  static const char* kHex = "0123456789abcdef";
  std::string out;
  out.reserve(n * 2);
  for (size_t i = 0; i < n; ++i) {
    out.push_back(kHex[bytes[i] >> 4]);
    out.push_back(kHex[bytes[i] & 0x0F]);
  }
  return out;
}

inline bool isValidCredential(const std::string& c) {
  if (c.size() < 32 || c.size() > 128) return false;
  for (char ch : c) {
    bool ok = (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') ||
              ch == '_' || ch == '-';
    if (!ok) return false;
  }
  return true;
}

}  // namespace zephora
