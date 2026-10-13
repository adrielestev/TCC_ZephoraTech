#pragma once

// Copie este arquivo para secrets.h e preencha os valores reais.
#define WIFI_SSID "NOME_DA_REDE"
#define WIFI_PASSWORD "SENHA_DA_REDE"

// Use o IP/host acessível pela rede Wi-Fi do ESP32, sem barra no final.
// Exemplo local: http://192.168.1.50:3000
// Em produção, use HTTPS e configure API_ROOT_CA abaixo.
#define API_BASE_URL "http://192.168.1.50:3000"

// Credencial gerada pelo administrador para a sala associada a este MAC.
#define DEVICE_CREDENTIAL "COLE_AQUI_A_CREDENCIAL_HEXADECIMAL_DE_64_CARACTERES"

// Certificado CA raiz em formato PEM para validar o HTTPS.
// Deixe vazio somente quando API_BASE_URL usar HTTP em ambiente de teste.
inline constexpr char API_ROOT_CA[] = "";