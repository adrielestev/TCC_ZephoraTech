#pragma once
#include <stdint.h>

namespace zephora {

// Filtra a leitura bruta de um PIR:
//  - ignora o aquecimento do sensor (HC-SR501 leva ~30–60 s após ligar);
//  - presença vira true na hora e só volta a false após `holdMs` sem movimento
//    (evita a luz "piscar" quando a pessoa fica parada).
class PresenceFilter {
 public:
  PresenceFilter(uint32_t holdMs, uint32_t warmupMs) : holdMs_(holdMs), warmupMs_(warmupMs) {}

  bool update(bool raw, uint32_t nowMs) {
    if (!started_) {
      started_ = true;
      startMs_ = nowMs;
    }
    if (nowMs - startMs_ < warmupMs_) return false;
    if (raw) {
      present_ = true;
      lastRawMs_ = nowMs;
    } else if (present_ && nowMs - lastRawMs_ >= holdMs_) {
      present_ = false;
    }
    return present_;
  }

  bool present() const { return present_; }

 private:
  uint32_t holdMs_, warmupMs_;
  uint32_t startMs_ = 0, lastRawMs_ = 0;
  bool started_ = false, present_ = false;
};

}  // namespace zephora
