// Declara o registro que valida e organiza os canais do ESP32.
#pragma once
#include <stddef.h>

#include "channel.h"

namespace zephora {

constexpr size_t kMaxChannels = 32;        // limite do backend (devices.max(32))
constexpr size_t kMaxChannelIdLen = 32;
constexpr size_t kMaxNameLen = 60;

enum class AddResult { Ok, Full, InvalidId, InvalidName, Duplicate };

class ChannelRegistry {
 public:
  AddResult add(Channel& ch);
  size_t size() const { return count_; }
  Channel& at(size_t i) { return *items_[i]; }
  const Channel& at(size_t i) const { return *items_[i]; }
  Channel* find(const char* id);

  // Detecção de mudança: o que foi reportado com sucesso por último ao servidor
  bool changedSinceReport() const;
  void commitReported();

  static bool isValidId(const char* id);

 private:
  Channel* items_[kMaxChannels] = {};
  bool reported_[kMaxChannels] = {};
  bool hasReport_[kMaxChannels] = {};
  size_t count_ = 0;
};

}  // namespace zephora
