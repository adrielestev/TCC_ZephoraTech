#pragma once
#include "settings_store.h"

namespace zephora::portal {

// Abre o Wi-Fi "Zephora-XXXXXX" (senha ZEPHORA_PORTAL_PASSWORD) com a página de configuração em
// http://192.168.4.1 e BLOQUEIA até salvar (então reinicia). Não retorna.
// Se `alreadyConfigured`, fecha sozinho após kPortalIdleRebootMs sem uso.
[[noreturn]] void run(Settings& settings, bool alreadyConfigured);

}  // namespace zephora::portal
