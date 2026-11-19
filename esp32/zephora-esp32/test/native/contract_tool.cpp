// Ferramenta usada pelo teste de contrato (test/contract.test.js).
//  contract_tool payload            -> imprime o corpo que o firmware enviaria
//  contract_tool respond <estado>   -> lê a resposta da API no stdin, aplica os comandos e imprime o resultado
#include <stdio.h>
#include <string.h>

#include <iostream>
#include <iterator>
#include <sstream>

#include "../../src/core/channel_registry.h"
#include "../../src/core/sync_protocol.h"
#include "fakes.h"

using namespace zephora;

int main(int argc, char** argv) {
  FakeLight luz("relay_1", "Luz do quadro");
  FakePir pir("pir_1", "Presença");
  ChannelRegistry reg; reg.add(luz); reg.add(pir);

  if (argc >= 2 && !strcmp(argv[1], "payload")) {
    if (argc >= 3 && !strcmp(argv[2], "presence")) pir.presence = true;
    if (argc >= 3 && !strcmp(argv[2], "on")) luz.on = true;
    std::cout << buildSyncPayload(reg, "1.0.0");
    return 0;
  }
  if (argc >= 2 && !strcmp(argv[1], "respond")) {
    std::string body((std::istreambuf_iterator<char>(std::cin)), std::istreambuf_iterator<char>());
    SyncResponse r = handleSyncResponse(body.data(), body.size(), reg);
    printf("{\"valid\":%s,\"poll\":%u,\"applied\":%u,\"rejected\":%u,\"on\":%s}", r.valid ? "true" : "false",
           r.pollIntervalMs, r.applied, r.rejected, luz.on ? "true" : "false");
    return 0;
  }
  return 2;
}
