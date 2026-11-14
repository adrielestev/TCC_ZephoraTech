'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const env = require('../config/env');

if (env.DB_PATH !== ':memory:') {
  fs.mkdirSync(path.dirname(env.DB_PATH), { recursive: true });
}

const db = new DatabaseSync(env.DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;'); // por conexão
db.exec('PRAGMA busy_timeout = 5000;');
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

/**
 * Executa `fn` dentro de uma transação. `fn` precisa ser SÍNCRONA
 * (sem await) e não pode abrir outra transação.
 */
function transaction(fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

const isUniqueViolation = (err) => /UNIQUE constraint failed/i.test(err?.message ?? '');

module.exports = { db, transaction, isUniqueViolation };
