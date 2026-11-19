#include "sync_protocol.h"

#include <ArduinoJson.h>

namespace zephora {

std::string buildSyncPayload(const ChannelRegistry& registry, const char* firmware) {
  JsonDocument doc;
  if (firmware && *firmware) doc["firmware"] = firmware;
  JsonArray devices = doc["devices"].to<JsonArray>();
  for (size_t i = 0; i < registry.size(); ++i) {
    const Channel& ch = registry.at(i);
    const TypeInfo& info = typeInfo(ch.type());
    JsonObject d = devices.add<JsonObject>();
    d["channel"] = ch.id();
    d["type"] = info.wireName;
    d["name"] = ch.name();
    ch.writeState(d["state"].to<JsonObject>());
  }
  std::string out;
  serializeJson(doc, out);
  return out;
}

static uint32_t clampPoll(JsonVariantConst v) {
  if (!v.is<uint32_t>()) return kDefaultPollMs;
  uint32_t ms = v.as<uint32_t>();
  if (ms < kMinPollMs) return kMinPollMs;
  if (ms > kMaxPollMs) return kMaxPollMs;
  return ms;
}

SyncResponse handleSyncResponse(const char* body, size_t len, ChannelRegistry& registry) {
  SyncResponse result;
  if (!body || len == 0) return result;

  JsonDocument filter;
  filter["pollIntervalMs"] = true;
  filter["commands"][0]["channel"] = true;
  filter["commands"][0]["state"] = true;

  JsonDocument doc;
  if (deserializeJson(doc, body, len, DeserializationOption::Filter(filter))) return result;
  if (!doc.is<JsonObject>()) return result;

  result.valid = true;
  result.pollIntervalMs = clampPoll(doc["pollIntervalMs"]);

  JsonArrayConst commands = doc["commands"].as<JsonArrayConst>();
  for (JsonVariantConst cmd : commands) {
    const char* channelId = cmd["channel"].is<const char*>() ? cmd["channel"].as<const char*>() : nullptr;
    Channel* ch = registry.find(channelId);
    JsonObjectConst state = cmd["state"].as<JsonObjectConst>();
    bool ok = false;
    if (ch && !state.isNull() && state.size() == 1) {
      const TypeInfo& info = typeInfo(ch->type());
      JsonVariantConst value = state[info.stateKey];
      if (info.controllable && value.is<bool>()) ok = ch->setState(value.as<bool>());
    }
    if (ok) { if (result.applied < 255) ++result.applied; }
    else    { if (result.rejected < 255) ++result.rejected; }
  }
  return result;
}

}  // namespace zephora
