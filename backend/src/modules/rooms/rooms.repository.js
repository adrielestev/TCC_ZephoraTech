// Consulta e altera salas, acessos e fotos no banco.
'use strict';

const { db } = require('../../database/db');

const PHOTO_COLUMNS = Object.freeze({
  1: 'photo_1_path',
  2: 'photo_2_path',
  3: 'photo_3_path',
});

const BASE = `SELECT r.*,
  (SELECT COUNT(*) FROM devices d WHERE d.room_id = r.id AND d.registration_status = 'registered') AS device_count
  FROM rooms r`;

const listAll = () => db.prepare(`${BASE} ORDER BY r.name COLLATE NOCASE`).all();
const listForUser = (userId) =>
  db
    .prepare(
      `${BASE} JOIN room_access ra ON ra.room_id = r.id WHERE ra.user_id = ? ORDER BY r.name COLLATE NOCASE`,
    )
    .all(userId);
const findById = (id) => db.prepare(`${BASE} WHERE r.id = ?`).get(id);

function insert({ name, description, createdBy }) {
  const { lastInsertRowid } = db
    .prepare('INSERT INTO rooms (name, description, created_by) VALUES (?, ?, ?)')
    .run(name, description ?? null, createdBy);
  return findById(Number(lastInsertRowid));
}

function update(id, patch) {
  const fields = [];
  const values = [];
  for (const key of ['name', 'description']) {
    if (key in patch) {
      fields.push(`${key} = ?`);
      values.push(patch[key] ?? null);
    }
  }
  if (fields.length === 0) return;
  db.prepare(
    `UPDATE rooms SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  ).run(...values, id);
}

const remove = (id) => db.prepare('DELETE FROM rooms WHERE id = ?').run(id);

const setPhoto = (id, slot, path) =>
  db
    .prepare(
      `UPDATE rooms SET ${PHOTO_COLUMNS[slot]} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    )
    .run(path, id);

const hasAccess = (userId, roomId) =>
  Boolean(
    db.prepare('SELECT 1 FROM room_access WHERE user_id = ? AND room_id = ?').get(userId, roomId),
  );

function countByIds(ids) {
  if (ids.length === 0) return 0;
  const marks = ids.map(() => '?').join(',');
  return db.prepare(`SELECT COUNT(*) AS c FROM rooms WHERE id IN (${marks})`).get(...ids).c;
}

const listAccessRoomIds = (userId) =>
  db
    .prepare('SELECT room_id FROM room_access WHERE user_id = ? ORDER BY room_id')
    .all(userId)
    .map((r) => r.room_id);

/** Chamar dentro de `transaction`. */
function replaceUserAccess(userId, roomIds, grantedBy) {
  db.prepare('DELETE FROM room_access WHERE user_id = ?').run(userId);
  const insertStmt = db.prepare(
    'INSERT INTO room_access (user_id, room_id, granted_by) VALUES (?, ?, ?)',
  );
  for (const roomId of roomIds) insertStmt.run(userId, roomId, grantedBy);
}

const listUsersWithAccess = (roomId) =>
  db
    .prepare(
      `SELECT u.* FROM room_access ra JOIN users u ON u.id = ra.user_id
       WHERE ra.room_id = ? ORDER BY u.name COLLATE NOCASE`,
    )
    .all(roomId);

module.exports = {
  listAll,
  listForUser,
  findById,
  insert,
  update,
  remove,
  setPhoto,
  hasAccess,
  countByIds,
  listAccessRoomIds,
  replaceUserAccess,
  listUsersWithAccess,
};
