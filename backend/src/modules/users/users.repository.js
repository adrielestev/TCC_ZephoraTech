// Consulta e altera usuários e códigos de verificação no banco.
'use strict';

const { db } = require('../../database/db');

// Colunas por finalidade do código de 6 dígitos (nomes fixos: nunca vêm do cliente)
const CODE_COLUMNS = Object.freeze({
  verification: {
    hash: 'verification_code_hash',
    expires: 'verification_code_expires_at',
    attempts: 'verification_code_attempts',
  },
  reset: {
    hash: 'reset_code_hash',
    expires: 'reset_code_expires_at',
    attempts: 'reset_code_attempts',
  },
});

const findById = (id) => db.prepare('SELECT * FROM users WHERE id = ?').get(id);
const findByEmail = (email) => db.prepare('SELECT * FROM users WHERE email = ?').get(email);

function insert({ name, email, passwordHash, role = 'member' }) {
  const { lastInsertRowid } = db
    .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(name, email, passwordHash, role);
  return findById(Number(lastInsertRowid));
}

const likePattern = (q) => `%${q.replace(/[\\%_]/g, '\\$&')}%`;

function list({ q, limit, offset }) {
  const where = q ? "WHERE (name LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\')" : '';
  const params = q ? [likePattern(q), likePattern(q)] : [];
  const rows = db
    .prepare(`SELECT * FROM users ${where} ORDER BY name COLLATE NOCASE LIMIT ? OFFSET ?`)
    .all(...params, limit, offset);
  const { total } = db.prepare(`SELECT COUNT(*) AS total FROM users ${where}`).get(...params);
  return { rows, total };
}

const setCode = (id, kind, hash, expiresAt) => {
  const c = CODE_COLUMNS[kind];
  db.prepare(
    `UPDATE users SET ${c.hash} = ?, ${c.expires} = ?, ${c.attempts} = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  ).run(hash, expiresAt, id);
};

const clearCode = (id, kind) => {
  const c = CODE_COLUMNS[kind];
  db.prepare(
    `UPDATE users SET ${c.hash} = NULL, ${c.expires} = NULL, ${c.attempts} = 0 WHERE id = ?`,
  ).run(id);
};

const incrementCodeAttempts = (id, kind) => {
  const c = CODE_COLUMNS[kind];
  db.prepare(`UPDATE users SET ${c.attempts} = ${c.attempts} + 1 WHERE id = ?`).run(id);
};

const markEmailVerified = (id) =>
  db
    .prepare(
      `UPDATE users SET email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP),
         verification_code_hash = NULL, verification_code_expires_at = NULL, verification_code_attempts = 0,
         updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    )
    .run(id);

// Redefinir a senha por código enviado ao e-mail também comprova a posse do e-mail.
const updatePassword = (id, passwordHash) =>
  db
    .prepare(
      `UPDATE users SET password_hash = ?, email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP),
         reset_code_hash = NULL, reset_code_expires_at = NULL, reset_code_attempts = 0,
         verification_code_hash = NULL, verification_code_expires_at = NULL, verification_code_attempts = 0,
         updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    )
    .run(passwordHash, id);

const updateName = (id, name) =>
  db
    .prepare('UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(name, id);
const updateAvatar = (id, path) =>
  db
    .prepare('UPDATE users SET avatar_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(path, id);
const setRole = (id, role) =>
  db
    .prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(role, id);
const setActive = (id, isActive) =>
  db
    .prepare('UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(isActive ? 1 : 0, id);

module.exports = {
  CODE_COLUMNS,
  findById,
  findByEmail,
  insert,
  list,
  setCode,
  clearCode,
  incrementCodeAttempts,
  markEmailVerified,
  updatePassword,
  updateName,
  updateAvatar,
  setRole,
  setActive,
};
