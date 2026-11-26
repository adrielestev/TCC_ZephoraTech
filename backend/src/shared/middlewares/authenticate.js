// Verifica o token do usuário e carrega seus dados atuais.
'use strict';

const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const AppError = require('../errors');
const { passwordFingerprint } = require('../crypto');
const usersRepository = require('../../modules/users/users.repository');

const invalid = () => AppError.unauthorized('Sessão inválida ou expirada', 'INVALID_TOKEN');

/** Autentica o usuário via "Authorization: Bearer <jwt>" e recarrega seus dados do banco. */
module.exports = function authenticate(req, _res, next) {
  const match = /^Bearer\s+(\S+)$/i.exec(req.get('authorization') ?? '');
  if (!match) throw AppError.unauthorized();

  let payload;
  try {
    payload = jwt.verify(match[1], env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'zephora',
    });
  } catch {
    throw invalid();
  }

  // Papel, status e senha vêm sempre do banco: promoção, desativação e troca de senha valem na hora.
  const user = usersRepository.findById(Number(payload.sub));
  if (!user || !user.is_active || payload.pv !== passwordFingerprint(user.password_hash))
    throw invalid();

  req.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  next();
};
