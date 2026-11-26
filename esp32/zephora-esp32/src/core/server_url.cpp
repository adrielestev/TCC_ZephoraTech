// Valida e normaliza o endereço do servidor da API.
#include "server_url.h"

#include <ctype.h>
#include <stdlib.h>

namespace zephora {

static bool fail(std::string* e, const char* msg) {
  if (e) *e = msg;
  return false;
}

bool parseServerUrl(const std::string& input, ServerUrl& out, std::string* error) {
  size_t b = 0, e = input.size();
  while (b < e && isspace(static_cast<unsigned char>(input[b]))) ++b;
  while (e > b && isspace(static_cast<unsigned char>(input[e - 1]))) --e;
  std::string url = input.substr(b, e - b);
  if (url.empty()) return fail(error, "Informe o endereço do servidor");
  if (url.size() > 200) return fail(error, "Endereço do servidor muito longo");

  bool https;
  size_t pos;
  if (url.compare(0, 8, "https://") == 0) { https = true; pos = 8; }
  else if (url.compare(0, 7, "http://") == 0) { https = false; pos = 7; }
  else return fail(error, "O endereço deve começar com http:// ou https://");

  for (char c : url) {
    unsigned char u = static_cast<unsigned char>(c);
    if (isspace(u) || u < 0x21 || u > 0x7E) return fail(error, "O endereço contém caracteres inválidos");
    if (c == '?' || c == '#') return fail(error, "O endereço não pode ter ? nem #");
  }

  size_t slash = url.find('/', pos);
  std::string authority = url.substr(pos, slash == std::string::npos ? std::string::npos : slash - pos);
  std::string path = slash == std::string::npos ? "" : url.substr(slash);

  if (authority.empty()) return fail(error, "Falta o nome do servidor");
  if (authority.find('@') != std::string::npos)
    return fail(error, "Não coloque usuário ou senha no endereço");

  std::string host = authority;
  size_t colon = authority.rfind(':');
  if (colon != std::string::npos) {
    host = authority.substr(0, colon);
    std::string port = authority.substr(colon + 1);
    if (port.empty() || port.size() > 5) return fail(error, "Porta inválida");
    for (char c : port)
      if (!isdigit(static_cast<unsigned char>(c))) return fail(error, "Porta inválida");
    long p = strtol(port.c_str(), nullptr, 10);
    if (p < 1 || p > 65535) return fail(error, "Porta inválida");
  }
  if (host.empty()) return fail(error, "Falta o nome do servidor");
  for (char c : host) {
    bool ok = isalnum(static_cast<unsigned char>(c)) || c == '.' || c == '-';
    if (!ok) return fail(error, "Nome do servidor inválido");
  }

  while (!path.empty() && path.back() == '/') path.pop_back();
  out.https = https;
  out.base = std::string(https ? "https://" : "http://") + authority + path;
  return true;
}

}  // namespace zephora
