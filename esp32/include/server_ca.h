#pragma once
// Certificado RAIZ da CA que assina o HTTPS da API (formato PEM).
// Let's Encrypt: ISRG Root X1 (https://letsencrypt.org/certs/isrgrootx1.pem).
// Deixe vazio se a API for acessada por HTTP puro dentro da rede da escola.
// Com HTTPS e este campo vazio o firmware RECUSA conectar (a menos que
// ZEPHORA_ALLOW_INSECURE_TLS=1, só para desenvolvimento).
namespace zephora {
constexpr const char* kServerCaPem = R"PEM(
)PEM";
}
