// Autentica módulos ESP32 usando a credencial enviada na requisição.
'use strict';

const AppError = require('../errors');
const { CREDENTIAL_REGEX, sha256 } = require('../crypto');
const esp32Repository = require('../../modules/esp32/esp32.repository');

/** Autentica o ESP32 pelo header X-ESP32-Credential (comparando o hash armazenado). */
module.exports = function authenticateEsp32(req, _res, next) {
  const credential = req.get('x-esp32-credential');
  if (!credential || !CREDENTIAL_REGEX.test(credential)) {
    throw AppError.unauthorized('Credencial inválida', 'INVALID_CREDENTIAL');
  }
  const module_ = esp32Repository.findByCredentialHash(sha256(credential));
  if (!module_) throw AppError.unauthorized('Credencial inválida', 'INVALID_CREDENTIAL');

  req.esp32 = module_;
  next();
};
