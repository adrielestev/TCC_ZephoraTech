// Calcula se um módulo ESP32 está pendente, online ou offline.
'use strict';

const env = require('../config/env');
const { fromSql } = require('./time');

/**
 * Status derivado de `last_seen_at` (não é guardado no banco, então nunca fica desatualizado):
 *  - pending: o módulo ainda não sincronizou;
 *  - online: sincronizou dentro de ESP32_OFFLINE_AFTER_SECONDS;
 *  - offline: parou de sincronizar.
 */
function esp32Status(lastSeenAt) {
  if (!lastSeenAt) return 'pending';
  const elapsedMs = Date.now() - fromSql(lastSeenAt).getTime();
  return elapsedMs <= env.ESP32_OFFLINE_AFTER_SECONDS * 1000 ? 'online' : 'offline';
}

module.exports = { esp32Status };
