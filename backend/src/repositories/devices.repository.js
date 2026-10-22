import { db } from "../db.js";

export const findById = (id, executor = db) =>
  executor("sensors").where({ id }).first();
export const listForRoom = (room_id) =>
  db("sensors").where({ room_id }).orderBy("id");
export const listForDevice = (room_id) =>
  db("sensors").where({ room_id }).orderBy("id");
export const create = (device) => db("sensors").insert(device);
export const update = (id, device) =>
  db("sensors").where({ id }).update(device);
export const remove = (id, executor = db) =>
  executor("sensors").where({ id }).del();
export const setDesiredState = (id, value, executor = db) =>
  executor("sensors")
    .where({ id })
    .update({ desired_state: value, updated_at: db.fn.now() });
export const reportState = (sensor, value) =>
  db("sensors")
    .where({ id: sensor.id })
    .update({
      current_state: value,
      ...(sensor.direction === "output" ? { desired_state: value } : {}),
      updated_at: db.fn.now(),
    });
export const setAutomationTarget = (room_id, id, value, executor = db) =>
  executor("sensors")
    .where({ id, room_id, direction: "output" })
    .update({ desired_state: value, updated_at: db.fn.now() });
