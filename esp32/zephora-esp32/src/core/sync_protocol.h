// Define os dados e as funções do protocolo de sincronização com a API.
#pragma once
// Protocolo com a API: POST /api/device-sync (ver README do backend).
// Este módulo não depende do Arduino: roda e é testado no computador.
#include <stddef.h>
#include <stdint.h>

#include <string>

#include "channel_registry.h"

namespace zephora {

constexpr uint32_t kDefaultPollMs = 3000;
constexpr uint32_t kMinPollMs = 1000;   // o limitador da API aceita 120 req/min por módulo
constexpr uint32_t kMaxPollMs = 60000;

// Corpo do POST: { "firmware": "...", "devices": [ {channel,type,name,state}, ... ] }
std::string buildSyncPayload(const ChannelRegistry& registry, const char* firmware);

struct SyncResponse {
  bool valid = false;            // JSON compreendido
  uint32_t pollIntervalMs = kDefaultPollMs;
  uint8_t applied = 0;           // comandos executados
  uint8_t rejected = 0;          // comandos ignorados (canal/estado inválido, aparelho não controlável)
  uint8_t configsApplied = 0;
  uint8_t configsRejected = 0;
};

// Lê a resposta e EXECUTA os comandos nos canais. Comando suspeito é descartado, nunca aplicado.
SyncResponse handleSyncResponse(const char* body, size_t len, ChannelRegistry& registry);

}  // namespace zephora
