'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const AppError = require('../../shared/errors');
const mailer = require('../../shared/mailer');
const { passwordFingerprint } = require('../../shared/crypto');
const { isUniqueViolation } = require('../../database/db');
const usersRepository = require('../users/users.repository');
const usersService = require('../users/users.service');
const codes = require('./verification-codes');

// Hash fictício: iguala o tempo de resposta quando o e-mail não existe
const DUMMY_HASH = bcrypt.hashSync('zephora-timing-equalizer', env.BCRYPT_COST);

const MESSAGES = {
  register: 'Se o cadastro for possível, enviamos um código de verificação para o seu e-mail.',
  resend: 'Se o e-mail estiver pendente de verificação, enviamos um novo código.',
  forgot: 'Se o e-mail estiver cadastrado, enviamos um código para redefinir a senha.',
  verified: 'E-mail verificado com sucesso.',
  reset: 'Senha redefinida com sucesso. Faça login com a nova senha.',
};

const invalidCode = () => AppError.badRequest('Código inválido ou expirado', 'INVALID_CODE');

function assertEmailDomainAllowed(email) {
  if (env.allowedEmailDomains.length === 0) return;
  if (!env.allowedEmailDomains.includes(email.split('@')[1])) {
    throw AppError.badRequest(
      'Use o e-mail institucional para se cadastrar',
      'EMAIL_DOMAIN_NOT_ALLOWED',
    );
  }
}

function sendCode(user, kind) {
  const code = codes.issue(user, kind);
  if (!code) return; // dentro do intervalo de reenvio
  if (kind === 'verification') mailer.sendVerificationCode(user.email, code);
  else mailer.sendPasswordResetCode(user.email, code);
}

const signToken = (user) =>
  jwt.sign({ pv: passwordFingerprint(user.password_hash) }, env.JWT_SECRET, {
    algorithm: 'HS256',
    issuer: 'zephora',
    subject: String(user.id),
    expiresIn: env.JWT_EXPIRES_IN,
  });

/** Resposta sempre igual, exista o e-mail ou não (não permite enumerar contas). */
async function register({ name, email, password }) {
  assertEmailDomainAllowed(email);
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_COST); // custo constante

  let user = usersRepository.findByEmail(email);
  if (!user) {
    try {
      user = usersRepository.insert({ name, email, passwordHash });
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      user = usersRepository.findByEmail(email); // cadastro simultâneo
    }
  }
  if (!user.email_verified_at) sendCode(user, 'verification');
  return { message: MESSAGES.register };
}

async function verifyEmail({ email, code }) {
  const user = usersRepository.findByEmail(email);
  if (!user || user.email_verified_at || !codes.consume(user, 'verification', code))
    throw invalidCode();
  usersRepository.markEmailVerified(user.id);
  return { message: MESSAGES.verified };
}

async function resendVerification({ email }) {
  const user = usersRepository.findByEmail(email);
  if (user && user.is_active && !user.email_verified_at) sendCode(user, 'verification');
  return { message: MESSAGES.resend };
}

async function login({ email, password }) {
  const user = usersRepository.findByEmail(email);
  const passwordMatches = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !passwordMatches) {
    throw AppError.unauthorized('E-mail ou senha incorretos', 'INVALID_CREDENTIALS');
  }
  // Só depois de provar a senha informamos o estado da conta
  if (!user.is_active)
    throw AppError.forbidden('Conta desativada. Procure o administrador', 'ACCOUNT_DISABLED');
  if (!user.email_verified_at) {
    sendCode(user, 'verification');
    throw AppError.forbidden('Verifique seu e-mail para entrar', 'EMAIL_NOT_VERIFIED');
  }
  return { token: signToken(user), user: usersService.toPublic(user) };
}

async function forgotPassword({ email }) {
  const user = usersRepository.findByEmail(email);
  if (user && user.is_active) sendCode(user, 'reset');
  return { message: MESSAGES.forgot };
}

async function resetPassword({ email, code, newPassword }) {
  const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_COST); // custo constante
  const user = usersRepository.findByEmail(email);
  if (!user || !user.is_active || !codes.consume(user, 'reset', code)) throw invalidCode();
  usersRepository.updatePassword(user.id, passwordHash); // invalida os JWTs antigos
  return { message: MESSAGES.reset };
}

const me = (userId) => usersService.get(userId);

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  forgotPassword,
  resetPassword,
  me,
};
