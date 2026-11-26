// Envia dados de sincronização à API por HTTP ou HTTPS.
#include "sync_client.h"

#include <Arduino.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <string.h>
#include <stdlib.h>

#include "../../include/config.h"
#include "../../include/server_ca.h"
#include "log.h"

namespace zephora {

static WiFiClient gPlain;
static WiFiClientSecure gSecure;
static HTTPClient gHttp;
static bool gTlsConfigured = false;
static bool gTlsUsable = false;

// HTTPS: valida o certificado do servidor contra a CA embutida em include/server_ca.h.
static bool configureTls() {
  if (gTlsConfigured) return gTlsUsable;
  gTlsConfigured = true;
  if (strstr(kServerCaPem, "BEGIN CERTIFICATE")) {
    gSecure.setCACert(kServerCaPem);
    gTlsUsable = true;
  } else if (ZEPHORA_ALLOW_INSECURE_TLS) {
    ZLOG("ATENCAO: HTTPS sem validar o certificado (ZEPHORA_ALLOW_INSECURE_TLS=1). Use só em desenvolvimento.");
    gSecure.setInsecure();
    gTlsUsable = true;
  } else {
    ZLOG("HTTPS sem certificado raiz: preencha include/server_ca.h (ou use http:// na rede interna).");
    gTlsUsable = false;
  }
  return gTlsUsable;
}

HttpResult postSync(const ServerUrl& server, const std::string& credential, const std::string& payload) {
  HttpResult r;
  if (server.https && !configureTls()) { r.status = -100; r.problem = "sem certificado raiz para HTTPS"; return r; }

  const std::string url = server.syncUrl(config::kSyncPath);
  bool started = server.https ? gHttp.begin(gSecure, url.c_str()) : gHttp.begin(gPlain, url.c_str());
  if (!started) { r.status = -101; r.problem = "URL recusada pelo cliente HTTP"; return r; }

  static const char* kKeys[] = {"Retry-After"};
  gHttp.collectHeaders(kKeys, 1);
  gHttp.setReuse(true);  // evita refazer o handshake TLS a cada ciclo
  gHttp.setConnectTimeout(config::kHttpTimeoutMs);
  gHttp.setTimeout(config::kHttpTimeoutMs);
  gHttp.addHeader("Content-Type", "application/json");
  gHttp.addHeader(config::kCredentialHeader, credential.c_str());

  int code = gHttp.POST(reinterpret_cast<uint8_t*>(const_cast<char*>(payload.data())), payload.size());
  r.status = code;
  if (code <= 0) {
    r.problem = "sem resposta do servidor";
    gHttp.end();
    return r;
  }

  int size = gHttp.getSize();
  if (size > static_cast<int>(config::kMaxResponseBytes)) {
    r.status = -102;
    r.problem = "resposta grande demais";
  } else {
    String body = gHttp.getString();
    if (body.length() > config::kMaxResponseBytes) { r.status = -102; r.problem = "resposta grande demais"; }
    else r.body.assign(body.c_str(), body.length());
  }
  String retry = gHttp.header("Retry-After");
  if (retry.length()) r.retryAfterMs = static_cast<uint32_t>(strtoul(retry.c_str(), nullptr, 10)) * 1000UL;
  gHttp.end();
  return r;
}

FailureKind classifyFailure(const HttpResult& r) {
  if (r.status <= 0) return FailureKind::Network;
  if (r.status == 401) return FailureKind::Auth;
  if (r.status == 429) return FailureKind::RateLimit;
  if (r.status >= 500) return FailureKind::Server;
  return FailureKind::BadRequest;  // 400, 404 (endereço errado), 3xx...
}

}  // namespace zephora
