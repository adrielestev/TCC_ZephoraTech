// src/features/esp32/constants.ts -- Centraliza a regra de validação da credencial usada no cadastro de módulos ESP32.
/** Mesma regra da API: 32 a 128 caracteres URL-safe. */
export const CREDENTIAL_REGEX = /^[A-Za-z0-9_-]{32,128}$/;
