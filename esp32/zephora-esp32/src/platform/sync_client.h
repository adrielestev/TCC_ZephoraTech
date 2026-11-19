#pragma once
#include <stdint.h>

#include <string>

#include "../core/server_url.h"
#include "../core/sync_scheduler.h"

namespace zephora {

struct HttpResult {
  int status = 0;              // código HTTP; <=0 = falha de rede/TLS/política
  std::string body;
  uint32_t retryAfterMs = 0;   // do cabeçalho Retry-After (429)
  const char* problem = nullptr;  // texto curto para o log quando status <= 0
};

// POST /api/device-sync com o cabeçalho X-ESP32-Credential.
HttpResult postSync(const ServerUrl& server, const std::string& credential, const std::string& payload);

// Traduz o resultado HTTP em tipo de falha para o agendador (só vale quando status != 200).
FailureKind classifyFailure(const HttpResult& r);

}  // namespace zephora
