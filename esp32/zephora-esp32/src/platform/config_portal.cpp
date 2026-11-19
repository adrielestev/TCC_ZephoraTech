#include "config_portal.h"

#include <Arduino.h>
#include <DNSServer.h>
#include <WebServer.h>
#include <WiFi.h>

#include <string.h>

#include <string>
#include <vector>

#include "../../include/config.h"
#include "../../include/portal_password.h"
#include "../core/server_url.h"
#include "log.h"
#include "status_led.h"

static_assert(__builtin_strlen(zephora::kPortalPassword) >= 8 && __builtin_strlen(zephora::kPortalPassword) <= 63,
              "kPortalPassword (include/portal_password.h) deve ter de 8 a 63 caracteres");

namespace zephora::portal {

namespace {

WebServer gServer(80);
DNSServer gDns;
Settings* gSettings = nullptr;
std::vector<String> gNetworks;
uint32_t gLastActivity = 0;

String esc(const String& in) {
  String out;
  out.reserve(in.length() + 8);
  for (size_t i = 0; i < in.length(); ++i) {
    char c = in[i];
    switch (c) {
      case '&': out += "&amp;"; break;
      case '<': out += "&lt;"; break;
      case '>': out += "&gt;"; break;
      case '"': out += "&quot;"; break;
      case '\'': out += "&#39;"; break;
      default: out += c;
    }
  }
  return out;
}

void scanNetworks() {
  gNetworks.clear();
  int n = WiFi.scanNetworks(false, false);
  for (int i = 0; i < n && gNetworks.size() < 20; ++i) {
    String s = WiFi.SSID(i);
    if (!s.length()) continue;
    bool dup = false;
    for (auto& e : gNetworks) if (e == s) dup = true;
    if (!dup) gNetworks.push_back(s);
  }
  WiFi.scanDelete();
}

const char kStyle[] PROGMEM =
    "<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;margin:0;background:#f4f6f8;color:#1b2430}"
    "main{max-width:480px;margin:0 auto;padding:20px}h1{font-size:22px;margin:0 0 4px}p.sub{margin:0 0 18px;color:#5b6675}"
    ".card{background:#fff;border-radius:14px;padding:16px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,.08)}"
    "h2{font-size:16px;margin:0 0 8px}label{display:block;font-weight:600;font-size:14px;margin:12px 0 4px}"
    "input{width:100%;padding:12px;border:1px solid #c5ccd6;border-radius:10px;font-size:16px}"
    "code{display:block;word-break:break-all;background:#eef1f5;border-radius:10px;padding:12px;font-size:13px;user-select:all}"
    "button{width:100%;padding:14px;border:0;border-radius:10px;background:#2563eb;color:#fff;font-size:16px;font-weight:600;margin-top:16px}"
    "button.sec{background:#e3e8ef;color:#1b2430;margin-top:10px}small{color:#5b6675}.err{background:#fde8e8;color:#8a1c1c;padding:12px;border-radius:10px;margin-bottom:16px}</style>";

String page(const String& error) {
  String h;
  h.reserve(4096);
  h += F("<!doctype html><html lang=pt-BR><head><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><title>Zephora</title>");
  h += FPSTR(kStyle);
  h += F("</head><body><main><h1>Zephora</h1><p class=sub>Configuração do módulo ESP32</p>");
  if (error.length()) { h += F("<div class=err>"); h += esc(error); h += F("</div>"); }

  h += F("<div class=card><h2>1. Código deste módulo</h2><small>No app, abra Administração › Módulos ESP32 › Novo módulo e cole o código abaixo.</small>"
         "<code id=c>");
  h += gSettings->credential.c_str();
  h += F("</code><button class=sec type=button onclick=\"var e=document.getElementById('c');var r=document.createRange();r.selectNode(e);"
         "var s=getSelection();s.removeAllRanges();s.addRange(r);try{document.execCommand('copy');this.textContent='Copiado!'}catch(x){}\">Copiar código</button></div>");

  h += F("<form class=card method=post action=/save><h2>2. Rede e servidor</h2>");
  h += F("<label for=s>Rede Wi-Fi da escola</label><input id=s name=ssid list=n maxlength=32 required autocomplete=off value='");
  h += esc(gSettings->ssid.c_str());
  h += F("'><datalist id=n>");
  for (auto& n : gNetworks) { h += F("<option value='"); h += esc(n); h += F("'>"); }
  h += F("</datalist><label for=p>Senha do Wi-Fi</label><input id=p name=pass type=password maxlength=63 autocomplete=off placeholder='");
  h += gSettings->ssid.length() ? F("deixe em branco para manter a atual") : F("em branco se a rede for aberta");
  h += F("'><label for=u>Endereço do servidor Zephora</label><input id=u name=url inputmode=url maxlength=200 required placeholder='https://zephora.suaescola.com.br' value='");
  h += esc(gSettings->serverUrl.c_str());
  h += F("'><small>Comece com http:// ou https://</small><button type=submit>Salvar e reiniciar</button>"
         "<button class=sec type=button onclick=\"location.href='/?rescan=1'\">Buscar redes de novo</button></form>");
  h += F("</main></body></html>");
  return h;
}

void touch() { gLastActivity = millis(); }

void handleRoot() {
  touch();
  if (gServer.hasArg("rescan")) scanNetworks();
  gServer.sendHeader("Cache-Control", "no-store");
  gServer.send(200, "text/html; charset=utf-8", page(""));
}

void handleSave() {
  touch();
  std::string ssid = gServer.arg("ssid").c_str();
  std::string pass = gServer.arg("pass").c_str();
  std::string url = gServer.arg("url").c_str();

  String error;
  ServerUrl parsed;
  std::string urlError;
  if (ssid.empty() || ssid.size() > 32) error = "Informe a rede Wi-Fi (até 32 caracteres).";
  else if (!pass.empty() && (pass.size() < 8 || pass.size() > 63)) error = "A senha do Wi-Fi deve ter de 8 a 63 caracteres.";
  else if (!parseServerUrl(url, parsed, &urlError)) error = urlError.c_str();

  if (error.length()) {
    gServer.send(400, "text/html; charset=utf-8", page(error));
    return;
  }
  // Senha em branco + mesma rede já salva = mantém a senha atual
  if (pass.empty() && ssid == gSettings->ssid) pass = gSettings->wifiPassword;

  if (!settings::saveNetwork(*gSettings, ssid, pass, parsed.base)) {
    gServer.send(500, "text/html; charset=utf-8", page("Não foi possível salvar. Tente de novo."));
    return;
  }
  gServer.send(200, "text/html; charset=utf-8",
               F("<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'>"
                 "<body style='font-family:system-ui;padding:24px'><h2>Salvo!</h2><p>O módulo vai reiniciar e conectar. "
                 "Volte ao app: em alguns segundos ele aparece como online.</p></body>"));
  delay(config::kRebootDelayMs);
  ESP.restart();
}

}  // namespace

void run(Settings& settings, bool alreadyConfigured) {
  gSettings = &settings;
  status_led::set(LedMode::Portal);

  String ap = "Zephora-";
  uint8_t mac[6];
  WiFi.macAddress(mac);
  char suffix[7];
  snprintf(suffix, sizeof(suffix), "%02X%02X%02X", mac[3], mac[4], mac[5]);
  ap += suffix;

  WiFi.mode(WIFI_AP_STA);
  if (strcmp(kPortalPassword, kPortalPasswordDefault) == 0)
    ZLOG("ATENCAO: senha do portal ainda é a padrão (include/portal_password.h)");
  WiFi.softAP(ap.c_str(), kPortalPassword);
  IPAddress ip = WiFi.softAPIP();
  scanNetworks();

  gDns.start(53, "*", ip);
  gServer.on("/", HTTP_GET, handleRoot);
  gServer.on("/save", HTTP_POST, handleSave);
  gServer.onNotFound([ip]() {  // portal cativo: qualquer endereço leva à página
    gServer.sendHeader("Location", String("http://") + ip.toString() + "/", true);
    gServer.send(302, "text/plain", "");
  });
  gServer.begin();
  touch();
  ZLOG("Portal aberto: Wi-Fi \"%s\" -> http://%s", ap.c_str(), ip.toString().c_str());

  for (;;) {
    gDns.processNextRequest();
    gServer.handleClient();
    uint32_t now = millis();
    status_led::update(now);
    if (alreadyConfigured && now - gLastActivity > config::kPortalIdleRebootMs) {
      ZLOG("Portal sem uso: voltando ao funcionamento normal");
      ESP.restart();
    }
    delay(2);
  }
}

}  // namespace zephora::portal
