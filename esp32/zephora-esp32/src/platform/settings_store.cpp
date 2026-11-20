#include "settings_store.h"

#include <Arduino.h>
#include <Preferences.h>
#include <esp_random.h>

#include "../core/credential.h"
#include "log.h"

namespace zephora::settings {

static constexpr const char* kNs = "zephora";

static std::string channelKey(const char* channelId) {
  uint32_t hash = 2166136261u;
  for (const unsigned char* p = reinterpret_cast<const unsigned char*>(channelId);
       p && *p; ++p) {
    hash ^= *p;
    hash *= 16777619u;
  }
  char key[12];
  snprintf(key, sizeof(key), "exec_%08x", static_cast<unsigned int>(hash));
  return key;
}

bool saveChannelExecutionConfig(const char* channelId, const char* json) {
  if (!channelId || !*channelId || !json) return false;
  Preferences p;
  if (!p.begin("zephora_exec", false)) return false;
  const std::string key = channelKey(channelId);
  bool ok = p.putString(key.c_str(), json) > 0;
  p.end();
  return ok;
}

bool loadChannelExecutionConfig(const char* channelId, std::string& json) {
  if (!channelId || !*channelId) return false;
  Preferences p;
  if (!p.begin("zephora_exec", true)) return false;
  const std::string key = channelKey(channelId);
  json = p.getString(key.c_str(), "").c_str();
  p.end();
  return !json.empty();
}

void load(Settings& s) {
  Preferences p;
  p.begin(kNs, true);
  s.ssid = p.getString("ssid", "").c_str();
  s.wifiPassword = p.getString("pass", "").c_str();
  s.serverUrl = p.getString("url", "").c_str();
  s.credential = p.getString("cred", "").c_str();
  p.end();
}

bool saveNetwork(Settings& s, const std::string& ssid, const std::string& password, const std::string& url) {
  Preferences p;
  if (!p.begin(kNs, false)) return false;
  bool ok = p.putString("ssid", ssid.c_str()) > 0 || ssid.empty();
  p.putString("pass", password.c_str());
  ok = ok && p.putString("url", url.c_str()) > 0;
  p.end();
  if (ok) { s.ssid = ssid; s.wifiPassword = password; s.serverUrl = url; }
  return ok;
}

void ensureCredential(Settings& s) {
  if (isValidCredential(s.credential)) return;
  uint8_t bytes[32];
  esp_fill_random(bytes, sizeof(bytes));
  s.credential = credentialFromBytes(bytes, sizeof(bytes));
  Preferences p;
  p.begin(kNs, false);
  p.putString("cred", s.credential.c_str());
  p.end();
  ZLOG("Credencial nova gerada");
}

bool saveCredential(Settings& s, const std::string& credential) {
  if (!isValidCredential(credential) || credential == s.credential) return false;
  Preferences p;
  if (!p.begin(kNs, false)) return false;
  p.putString("cred", credential.c_str());
  p.end();
  s.credential = credential;
  return true;
}

void requestPortal() {
  Preferences p;
  p.begin(kNs, false);
  p.putBool("portal", true);
  p.end();
}

bool takePortalRequest() {
  Preferences p;
  p.begin(kNs, false);
  bool requested = p.getBool("portal", false);
  if (requested) p.remove("portal");
  p.end();
  return requested;
}

void factoryReset() {
  Preferences p;
  p.begin(kNs, false);
  p.clear();
  p.end();
  Preferences execution;
  execution.begin("zephora_exec", false);
  execution.clear();
  execution.end();
}

}  // namespace zephora::settings
