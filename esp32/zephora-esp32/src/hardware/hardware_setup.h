// Declara a função que registra os aparelhos desta instalação.
#pragma once
#include "../core/channel_registry.h"

namespace zephora {
// Implementada em hardware_setup.cpp — ÚNICO arquivo que muda de uma instalação para outra.
void hardwareSetup(ChannelRegistry& registry);
}  // namespace zephora
