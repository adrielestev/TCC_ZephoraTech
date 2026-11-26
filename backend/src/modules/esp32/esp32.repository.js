// Consulta e altera os módulos ESP32 no banco de dados.
'use strict';

const { db } = require('../../database/db');
const { toSql } = require('../../shared/time');

const COUNTS = `
  (SELECT COUNT(*) FROM devices d WHERE d.esp32_id = m.id AND d.registration_status = 'registered') AS registered_count,
  (SELECT COUNT(*) FROM devices d WHERE d.esp32_id = m.id AND d.registration_status = 'discovered') AS discovered_count`;

const findById = (id) =>
  db.prepare(`SELECT m.*, ${COUNTS} FROM esp32_modules m WHERE m.id = ?`).get(id);
const findByCredentialHash = (hash) =>
  db.prepare('SELECT * FROM esp32_modules WHERE credential_hash = ?').get(hash);
const list = () =>
  db
    .prepare(`SELECT m.*, ${COUNTS} FROM esp32_modules m ORDER BY m.created_at DESC, m.id DESC`)
    .all();

function insert({ credentialHash, credentialHint, name, registeredBy }) {
  const { lastInsertRowid } = db
    .prepare(
      'INSERT INTO esp32_modules (credential_hash, credential_hint, name, registered_by) VALUES (?, ?, ?, ?)',
    )
    .run(credentialHash, credentialHint, name ?? null, registeredBy);
  return findById(Number(lastInsertRowid));
}

const remove = (id) => db.prepare('DELETE FROM esp32_modules WHERE id = ?').run(id);

/** Registra o contato do ESP32 (o status online é derivado de last_seen_at). */
const touch = (id, firmware) =>
  db
    .prepare(
      `UPDATE esp32_modules SET last_seen_at = ?,
         firmware_version = COALESCE(?, firmware_version), updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    )
    .run(toSql(), firmware, id);

module.exports = {
  findById,
  findByCredentialHash,
  list,
  insert,
  remove,
  touch,
};
