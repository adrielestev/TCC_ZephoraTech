#pragma once
// Configuração persistente (NVS). Pertence a este módulo: Wi-Fi, endereço da API e a credencial única.
#include <string>

namespace zephora {

struct Settings {
  std::string ssid;
  std::string wifiPassword;
  std::string serverUrl;
  std::string credential;
};

namespace settings {

void load(Settings& s);
bool saveNetwork(Settings& s, const std::string& ssid, const std::string& password, const std::string& serverUrl);
bool saveChannelExecutionConfig(const char* channelId, const char* json);
bool loadChannelExecutionConfig(const char* channelId, std::string& json);

// Gera a credencial (32 bytes do gerador de números aleatórios do chip) se ainda não existir.
// Chame com o rádio Wi-Fi ligado: só assim o esp_random() é aleatório de verdade (TRNG).
void ensureCredential(Settings& s);

// Só para desenvolvimento/simulação: fixa uma credencial conhecida (precisa ser válida).
bool saveCredential(Settings& s, const std::string& credential);

// Pedido de abrir o portal no próximo boot (botão BOOT mantido pressionado)
void requestPortal();
bool takePortalRequest();

// Apaga TUDO, inclusive a credencial. O admin precisará cadastrar o módulo de novo.
void factoryReset();

}  // namespace settings
}  // namespace zephora
