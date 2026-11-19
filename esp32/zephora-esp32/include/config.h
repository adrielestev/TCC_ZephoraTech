#pragma once
// Constantes de firmware (iguais em todas as instalações).
// O que muda por instalação fica SÓ em src/hardware/hardware_setup.cpp.

#include <stddef.h>
#include <stdint.h>
#include <time.h>

#ifndef ZEPHORA_FIRMWARE_VERSION
#define ZEPHORA_FIRMWARE_VERSION "1.0.0"
#endif
#ifndef ZEPHORA_ALLOW_INSECURE_TLS
#define ZEPHORA_ALLOW_INSECURE_TLS 0
#endif

namespace zephora::config {

// Botão BOOT das placas DevKit. Solte após 3 s = reabre o portal; após 15 s = restaura de fábrica.
constexpr int kButtonPin = 0;
constexpr uint32_t kPortalHoldMs = 3000;
constexpr uint32_t kFactoryResetHoldMs = 15000;

// LED de status (-1 desativa). O LED azul de muitas DevKit é o GPIO 2.
constexpr int kStatusLedPin = 2;

// Portal de configuração: se já estava configurado, fecha sozinho depois deste tempo
constexpr uint32_t kPortalIdleRebootMs = 10UL * 60UL * 1000UL;
constexpr uint32_t kRebootDelayMs = 1500;

// Rede
constexpr uint32_t kWifiConnectTimeoutMs = 20000;
constexpr uint32_t kWifiRestartAfterOfflineMs = 10UL * 60UL * 1000UL;
constexpr uint32_t kHttpTimeoutMs = 8000;
constexpr size_t kMaxResponseBytes = 8192;
constexpr time_t kMinValidEpoch = 1735689600;  // 2025-01-01: relógio já sincronizado (NTP)

// Protocolo (espelha o backend)
constexpr const char* kSyncPath = "/api/device-sync";
constexpr const char* kCredentialHeader = "X-ESP32-Credential";

}  // namespace zephora::config
