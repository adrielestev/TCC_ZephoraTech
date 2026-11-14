"use strict";

const { db } = require("../../database/db");
const { toSql } = require("../../shared/time");

const findById = (id) =>
  db.prepare("SELECT * FROM automations WHERE id = ?").get(id);
const listByRoom = (roomId) =>
  db
    .prepare(
      "SELECT * FROM automations WHERE room_id = ? ORDER BY name COLLATE NOCASE",
    )
    .all(roomId);

function listLinks(automationIds) {
  if (automationIds.length === 0) return [];
  const marks = automationIds.map(() => "?").join(",");
  return db
    .prepare(
      `SELECT * FROM automation_devices WHERE automation_id IN (${marks}) ORDER BY id`,
    )
    .all(...automationIds);
}

/** Chamar dentro de `transaction`. */
function insert({ roomId, name, createdBy, links }) {
  const { lastInsertRowid } = db
    .prepare(
      "INSERT INTO automations (room_id, name, created_by) VALUES (?, ?, ?)",
    )
    .run(roomId, name, createdBy);
  const automationId = Number(lastInsertRowid);
  const insertLink = db.prepare(
    "INSERT INTO automation_devices (automation_id, device_id, role, config) VALUES (?, ?, ?, ?)",
  );
  for (const link of links)
    insertLink.run(
      automationId,
      link.deviceId,
      link.role,
      JSON.stringify(link.config),
    );
  return automationId;
}

const updateName = (id, name) =>
  db
    .prepare(
      "UPDATE automations SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
    .run(name, id);

const setPaused = (id, paused, userId) =>
  db
    .prepare(
      `UPDATE automations SET is_paused = ?, paused_by = ?, paused_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    )
    .run(paused ? 1 : 0, paused ? userId : null, paused ? toSql() : null, id);

const remove = (id) =>
  db.prepare("DELETE FROM automations WHERE id = ?").run(id);

const findActiveByTriggerDevice = (deviceId) =>
  db
    .prepare(
      `SELECT DISTINCT a.* FROM automations a
       JOIN automation_devices ad ON ad.automation_id = a.id
       WHERE ad.device_id = ? AND ad.role = 'trigger' AND a.is_paused = 0`,
    )
    .all(deviceId);

const usesDevice = (deviceId) =>
  Boolean(
    db
      .prepare("SELECT 1 FROM automation_devices WHERE device_id = ? LIMIT 1")
      .get(deviceId),
  );

/** Remove automações que ficaram sem gatilho ou sem ação (ex.: após apagar um aparelho). */
const removeIncomplete = () =>
  db
    .prepare(
      `DELETE FROM automations
       WHERE id NOT IN (SELECT automation_id FROM automation_devices WHERE role = 'trigger')
          OR id NOT IN (SELECT automation_id FROM automation_devices WHERE role = 'action')`,
    )
    .run();

module.exports = {
  findById,
  listByRoom,
  listLinks,
  insert,
  updateName,
  setPaused,
  remove,
  findActiveByTriggerDevice,
  usesDevice,
  removeIncomplete,
};
