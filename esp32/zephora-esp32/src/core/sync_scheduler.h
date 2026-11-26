// Calcula quando sincronizar e como reagir a falhas de rede ou do servidor.
#pragma once
// Decide QUANDO sincronizar: ritmo do servidor, reação rápida a mudanças e recuo em falhas.
// Tempo em milissegundos do millis() (comparação segura contra estouro do contador).
#include <stdint.h>

#include "sync_protocol.h"

namespace zephora {

enum class FailureKind {
  Network,     // sem resposta / timeout / erro TLS
  Server,      // 5xx
  Auth,        // 401: credencial ainda não cadastrada pelo admin (ou removida)
  RateLimit,   // 429
  BadRequest,  // 400: payload recusado (bug de configuração)
};

class SyncScheduler {
 public:
  static constexpr uint32_t kMinGapMs = 1000;

  bool due(uint32_t now) const { return elapsed(now, nextDueMs_) >= 0; }

  // Sucesso: volta ao ritmo normal. Se houve comandos, confirma logo (kMinGapMs).
  void onSuccess(uint32_t now, uint32_t pollMs, bool hadCommands) {
    failures_ = 0;
    inBackoff_ = false;
    pollMs_ = pollMs;
    lastAttemptMs_ = now;
    nextDueMs_ = now + (hadCommands ? kMinGapMs : pollMs);
  }

  void onFailure(uint32_t now, FailureKind kind, uint32_t retryAfterMs = 0) {
    if (failures_ < 31) ++failures_;
    inBackoff_ = true;
    lastAttemptMs_ = now;
    nextDueMs_ = now + backoffMs(kind, failures_, retryAfterMs);
  }

  // Mudou o estado de um aparelho: sincroniza antes do próximo ciclo, respeitando o intervalo mínimo.
  // Durante recuo por falha, não antecipa (evita martelar um servidor/credencial com problema).
  void onLocalChange(uint32_t now) {
    if (inBackoff_) return;
    uint32_t earliest = lastAttemptMs_ + kMinGapMs;
    uint32_t target = elapsed(now, earliest) >= 0 ? now : earliest;
    if (elapsed(target, nextDueMs_) < 0) nextDueMs_ = target;
  }

  void reset(uint32_t now) {
    failures_ = 0;
    inBackoff_ = false;
    lastAttemptMs_ = now - kMinGapMs;
    nextDueMs_ = now;
  }

  uint8_t failures() const { return failures_; }
  uint32_t nextDueMs() const { return nextDueMs_; }

  static uint32_t backoffMs(FailureKind kind, uint8_t failures, uint32_t retryAfterMs) {
    // O limitador da API conta falhas de credencial por IP (60 a cada 15 min): recuo bem maior no 401.
    uint32_t base, cap;
    switch (kind) {
      case FailureKind::Auth:       base = 15000; cap = 120000; break;
      case FailureKind::RateLimit:  base = 30000; cap = 120000; break;
      case FailureKind::BadRequest: base = 30000; cap = 60000;  break;
      default:                      base = 2000;  cap = 60000;  break;
    }
    uint32_t delay = base;
    for (uint8_t i = 1; i < failures && delay < cap; ++i) delay *= 2;
    if (delay > cap) delay = cap;
    if (retryAfterMs > delay) delay = retryAfterMs > 300000 ? 300000 : retryAfterMs;
    return delay;
  }

 private:
  static int32_t elapsed(uint32_t now, uint32_t ref) { return static_cast<int32_t>(now - ref); }

  uint32_t nextDueMs_ = 0, lastAttemptMs_ = 0, pollMs_ = kDefaultPollMs;
  uint8_t failures_ = 0;
  bool inBackoff_ = false;
};

}  // namespace zephora
