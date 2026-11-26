// Registra os aparelhos e sensores ligados a esta instalação do ESP32.
// ============================================================================
//  ÚNICO ARQUIVO A EDITAR EM CADA INSTALAÇÃO
//  Descreva aqui o que está ligado a ESTE ESP32. Todo o resto do firmware
//  (credencial, portal de configuração, Wi-Fi, sincronização com a API) é padrão.
//
//  Cada aparelho é um "canal" com:
//    id   -> identificador fixo no módulo (letras, números, _ e -, até 32). NÃO mude depois de
//            cadastrado no app: o servidor reconhece o aparelho por ele.
//    nome -> como aparece para o admin ao escolher os aparelhos (pode ser trocado no app).
//
//  Tipos disponíveis:  RelayLight (luz por relé)  ·  PirSensor (sensor de presença)
//  Pinos seguros no ESP32 DevKit: 13, 14, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33
//  (evite 0, 2, 5, 12, 15 — usados na inicialização —, 6–11 — flash — e 34–39 para saída).
// ============================================================================
#include "hardware_setup.h"

#include <Arduino.h>

#include "../platform/log.h"
#include "dht22_sensor.h"
#include "pir_sensor.h"
#include "relay_light.h"

namespace zephora {

// Ajustes de simulação (platformio.ini, env wokwi). Em placa real ficam nos valores padrão.
#ifndef ZEPHORA_RELAY_ACTIVE_LOW
#define ZEPHORA_RELAY_ACTIVE_LOW 1
#endif
#ifndef ZEPHORA_PIR_HOLD_MS
#define ZEPHORA_PIR_HOLD_MS 30000
#endif
#ifndef ZEPHORA_PIR_WARMUP_MS
#define ZEPHORA_PIR_WARMUP_MS 45000
#endif

// ---- Aparelhos desta instalação ----
static PirSensor presenca("pir_1", "Presença da sala", /*pino*/ 27, /*segura presença por*/ ZEPHORA_PIR_HOLD_MS,
                            /*aquecimento*/ ZEPHORA_PIR_WARMUP_MS);
static Dht22Sensor temperatura("temperature_1", "Temperatura da sala", /*pino*/ 26);
static RelayLight rele1("relay_1", "Relé 1", /*pino*/ 18, /*ativo em nível baixo*/ ZEPHORA_RELAY_ACTIVE_LOW);
static RelayLight rele2("relay_2", "Relé 2", /*pino*/ 19, /*ativo em nível baixo*/ ZEPHORA_RELAY_ACTIVE_LOW);
static RelayLight rele3("relay_3", "Relé 3", /*pino*/ 21, /*ativo em nível baixo*/ ZEPHORA_RELAY_ACTIVE_LOW);
static RelayLight rele4("relay_4", "Relé 4", /*pino*/ 22, /*ativo em nível baixo*/ ZEPHORA_RELAY_ACTIVE_LOW);


static void add(ChannelRegistry& registry, Channel& channel) {
  AddResult r = registry.add(channel);
  if (r != AddResult::Ok) {
    ZLOG("ERRO em hardware_setup: canal \"%s\" recusado (%s)", channel.id(),
         r == AddResult::Duplicate ? "id repetido"
         : r == AddResult::InvalidId ? "id inválido"
         : r == AddResult::InvalidName ? "nome inválido" : "limite de 32 canais");
  }
}

void hardwareSetup(ChannelRegistry& registry) {
  add(registry, presenca);
  add(registry, temperatura);
  add(registry, rele1);
  add(registry, rele2);
  add(registry, rele3);
  add(registry, rele4);
}

}  // namespace zephora
