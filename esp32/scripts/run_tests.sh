#!/usr/bin/env bash
# Testes do núcleo do firmware, no computador (sem placa). Requer g++ e a biblioteca ArduinoJson.
# Uso: ARDUINOJSON_DIR=/caminho/ArduinoJson/src scripts/run_tests.sh
set -euo pipefail
cd "$(dirname "$0")/.."
AJ="${ARDUINOJSON_DIR:-}"
if [ -z "$AJ" ]; then
  echo "Defina ARDUINOJSON_DIR apontando para a pasta src do ArduinoJson (git clone https://github.com/bblanchon/ArduinoJson)"; exit 1
fi
mkdir -p .build
CORE="src/core/channel_registry.cpp src/core/server_url.cpp src/core/sync_protocol.cpp"
g++ -std=c++17 -Wall -Wextra -Werror -I"$AJ" test/native/test_core.cpp $CORE -o .build/test_core
.build/test_core
g++ -std=c++17 -Wall -Wextra -Werror -I"$AJ" test/native/contract_tool.cpp $CORE -o .build/contract_tool
if [ -n "${BACKEND_DIR:-}" ]; then
  node --test test/contract.test.js
else
  echo "Para o teste de contrato com a API real: BACKEND_DIR=/caminho/zephora-backend scripts/run_tests.sh"
fi
