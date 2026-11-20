'use strict';

const { db } = require('../../database/db');
const { toSql } = require('../../shared/time');

const SELECT = `SELECT d.*, m.last_seen_at AS esp32_last_seen_at FROM devices d JOIN esp32_modules m ON m.id = d.esp32_id`;

const findById = (id) => db.prepare(`${SELECT} WHERE d.id = ?`).get(id);

function findByIds(ids) {
  if (ids.length === 0) return [];
  const marks = ids.map(() => '?').join(',');
  return db.prepare(`${SELECT} WHERE d.id IN (${marks})`).all(...ids);
}

const listRegisteredByRoom = (roomId) =>
  db
    .prepare(
      `${SELECT} WHERE d.room_id = ? AND d.registration_status = 'registered' ORDER BY d.name COLLATE NOCASE`,
    )
    .all(roomId);

const listByEsp32 = (esp32Id) =>
  db.prepare(`${SELECT} WHERE d.esp32_id = ? ORDER BY d.id`).all(esp32Id);

function insertDiscovered(esp32Id, { channel, type, name, currentState }) {
  db.prepare(
    `INSERT INTO devices (esp32_id, name, type, channel, current_state, state_updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(esp32Id, name, type, channel, currentState, currentState ? toSql() : null);
}

const register = (id, { roomId, name, userId }) =>
  db
    .prepare(
      `UPDATE devices SET room_id = ?, name = ?, registration_status = 'registered',
         registered_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    )
    .run(roomId, name, userId, id);

const updateReported = (id, currentStateJson) =>
  db
    .prepare(
      'UPDATE devices SET current_state = ?, state_updated_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    )
    .run(currentStateJson, toSql(), id);

const setDesiredState = (id, desiredStateJson) =>
  db
    .prepare('UPDATE devices SET desired_state = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(desiredStateJson, id);

const setExecutionConfig = (id, executionConfigJson) =>
  db
    .prepare('UPDATE devices SET execution_config = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(executionConfigJson, id);

function update(id, patch) {
  const columns = { name: 'name', roomId: 'room_id' };
  const fields = [];
  const values = [];
  for (const [key, column] of Object.entries(columns)) {
    if (key in patch) {
      fields.push(`${column} = ?`);
      values.push(patch[key]);
    }
  }
  if (fields.length === 0) return;
  db.prepare(
    `UPDATE devices SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  ).run(...values, id);
}

const remove = (id) => db.prepare('DELETE FROM devices WHERE id = ?').run(id);

module.exports = {
  findById,
  findByIds,
  listRegisteredByRoom,
  listByEsp32,
  insertDiscovered,
  register,
  updateReported,
  setDesiredState,
  setExecutionConfig,
  update,
  remove,
};
