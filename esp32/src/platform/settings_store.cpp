#include "settings_store.h"

#include <Arduino.h>
#include <Preferences.h>
#include <esp_random.h>

#include "../core/credential.h"
#include "log.h"

namespace zephora::settings {

static constexpr const char* kNs = "zephora";

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
}

}  // namespace zephora::settings
