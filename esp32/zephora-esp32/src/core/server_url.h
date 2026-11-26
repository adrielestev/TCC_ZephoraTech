// Declara a estrutura e a função usadas para validar o endereço do servidor.
#pragma once
#include <string>

namespace zephora {

struct ServerUrl {
  bool https = false;
  std::string base;  // normalizada, sem "/" no final. Ex.: https://api.escola.com.br
  std::string syncUrl(const char* path) const { return base + path; }
};

// Aceita http(s)://host[:porta][/prefixo]. Recusa espaços, usuário:senha@, ?query e #fragmento.
// Na falha devolve false e uma mensagem em `error` (pt-BR, mostrada no portal).
bool parseServerUrl(const std::string& input, ServerUrl& out, std::string* error = nullptr);

}  // namespace zephora
