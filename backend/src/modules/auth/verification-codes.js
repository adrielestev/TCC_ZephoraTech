// Gera, armazena e verifica os códigos de confirmação e recuperação.
'use strict';

const env = require('../../config/env');
const { hmacCode, generateCode, safeEqualHex } = require('../../shared/crypto');
const { toSql, fromSql } = require('../../shared/time');
const usersRepository = require('../users/users.repository');

const { CODE_COLUMNS } = usersRepository;
const TTL_MS = env.CODE_TTL_MINUTES * 60_000;
const COOLDOWN_MS = env.CODE_RESEND_COOLDOWN_SECONDS * 1000;

/**
 * Gera e salva (apenas o HMAC) um novo código de 6 dígitos.
 * Devolve null se um código foi emitido há menos do que o intervalo de reenvio.
 */
function issue(user, kind) {
  const cols = CODE_COLUMNS[kind];
  const now = Date.now();

  if (user[cols.expires]) {
    const issuedAt = fromSql(user[cols.expires]).getTime() - TTL_MS;
    if (now - issuedAt < COOLDOWN_MS) return null;
  }

  const code = generateCode();
  usersRepository.setCode(
    user.id,
    kind,
    hmacCode(kind, user.id, code),
    toSql(new Date(now + TTL_MS)),
  );
  return code;
}

/** Valida o código (uso único). Conta tentativas erradas e bloqueia ao atingir o limite. */
function consume(user, kind, code) {
  const fresh = usersRepository.findById(user.id);
  const cols = CODE_COLUMNS[kind];
  const hash = fresh[cols.hash];
  const expiresAt = fresh[cols.expires];

  if (!hash || !expiresAt || fromSql(expiresAt).getTime() < Date.now()) return false;
  if (fresh[cols.attempts] >= env.CODE_MAX_ATTEMPTS) return false;

  if (!safeEqualHex(hash, hmacCode(kind, fresh.id, code))) {
    usersRepository.incrementCodeAttempts(fresh.id, kind);
    return false;
  }
  usersRepository.clearCode(fresh.id, kind);
  return true;
}

module.exports = { issue, consume };
