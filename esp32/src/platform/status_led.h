#pragma once
#include <stdint.h>

namespace zephora {

// O que o LED comunica (todos sem bloquear o loop):
//  Off ........ sem LED configurado
//  Portal ..... pisca rápido (150 ms): modo de configuração (Wi-Fi "Zephora-XXXXXX")
//  Connecting . pisca lento (1 s): sem Wi-Fi ou sem relógio (NTP)
//  Online ..... apagado, com um pulso curto a cada 5 s: tudo certo
//  Attention .. dois pulsos a cada 2 s: servidor recusou a credencial (cadastre o módulo no app)
//  Error ...... aceso quase fixo: servidor/rede com falha
//  Button ..... aceso fixo: botão segurado há tempo suficiente (solte para abrir o portal)
enum class LedMode : uint8_t { Off, Portal, Connecting, Online, Attention, Error, Button };

namespace status_led {
void begin();
void set(LedMode mode);
void update(uint32_t nowMs);
}  // namespace status_led

}  // namespace zephora
