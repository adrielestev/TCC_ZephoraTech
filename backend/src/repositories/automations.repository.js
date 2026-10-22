import { db } from "../db.js";

export const findById = (id, executor = db) =>
  executor("automation_rules").where({ id }).first();
export const findUsingDevice = (deviceId, executor = db) =>
  executor("automation_rules")
    .where("source_sensor_id", deviceId)
    .orWhere("target_sensor_id", deviceId)
    .select("id", "name");
export const findForRoom = (room_id) =>
  db("automation_rules")
    .join("sensors as source", "source.id", "automation_rules.source_sensor_id")
    .where("source.room_id", room_id)
    .select("automation_rules.*");
export const findEnabledForInput = (source_sensor_id) =>
  db("automation_rules").where({ source_sensor_id, is_enabled: 1 });
export const findActiveForTarget = (target_sensor_id, executor = db) =>
  executor("automation_rules")
    .where({ target_sensor_id, is_enabled: 1, is_active: 1, restore_previous: 1 })
    .first();
export const findActiveLocksForRoom = (roomId) =>
  db("automation_rules")
    .join("sensors as target", "target.id", "automation_rules.target_sensor_id")
    .where("target.room_id", roomId)
    .where({
      "automation_rules.is_enabled": 1,
      "automation_rules.is_active": 1,
      "automation_rules.restore_previous": 1,
    })
    .select(
      "automation_rules.id",
      "automation_rules.name",
      "automation_rules.target_sensor_id",
    );
export const create = (rule, executor = db) =>
  executor("automation_rules").insert(rule);
export const update = (id, rule, executor = db) =>
  executor("automation_rules").where({ id }).update(rule);
export const remove = (id, executor = db) =>
  executor("automation_rules").where({ id }).del();
