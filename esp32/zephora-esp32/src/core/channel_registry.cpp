// Implementa o cadastro, a validação e a busca dos canais do ESP32.
#include "channel_registry.h"

#include <string.h>

namespace zephora {

bool ChannelRegistry::isValidId(const char* id) {
  if (!id) return false;
  size_t n = strlen(id);
  if (n < 1 || n > kMaxChannelIdLen) return false;
  for (size_t i = 0; i < n; ++i) {
    char c = id[i];
    bool ok = (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') ||
              c == '_' || c == '-';
    if (!ok) return false;
  }
  return true;
}

AddResult ChannelRegistry::add(Channel& ch) {
  if (count_ >= kMaxChannels) return AddResult::Full;
  if (!isValidId(ch.id())) return AddResult::InvalidId;
  const char* name = ch.name();
  if (!name || strlen(name) < 1 || strlen(name) > kMaxNameLen) return AddResult::InvalidName;
  if (find(ch.id())) return AddResult::Duplicate;
  items_[count_++] = &ch;
  return AddResult::Ok;
}

Channel* ChannelRegistry::find(const char* id) {
  if (!id) return nullptr;
  for (size_t i = 0; i < count_; ++i)
    if (strcmp(items_[i]->id(), id) == 0) return items_[i];
  return nullptr;
}

bool ChannelRegistry::changedSinceReport() const {
  for (size_t i = 0; i < count_; ++i)
    if (!hasReport_[i] || reported_[i] != items_[i]->state()) return true;
  return false;
}

void ChannelRegistry::commitReported() {
  for (size_t i = 0; i < count_; ++i) {
    reported_[i] = items_[i]->state();
    hasReport_[i] = true;
  }
}

}  // namespace zephora
