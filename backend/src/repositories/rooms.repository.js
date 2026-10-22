import { db } from "../db.js";

export const findRoomById = (id) => db("rooms").where({ id }).first();
export const findRoomByMac = (mac_address) => db("rooms").where({ mac_address }).first();
export const listRoomsForAdmin = () => db("rooms").select("rooms.*").orderBy("rooms.id");
export const listRoomsForCollaborator = (userId) => db("rooms")
  .join("room_collaborators", "rooms.id", "room_collaborators.room_id")
  .where("room_collaborators.user_id", userId).select("rooms.*").orderBy("rooms.id");
export const createRoom = (room) => db("rooms").insert(room);
export const updateRoom = (id, room) => db("rooms").where({ id }).update(room);
export const deleteRoom = (id) => db("rooms").where({ id }).del();
export const touchRoom = (id, timestamp = new Date().toISOString()) => db("rooms").where({ id }).update({ last_seen_at: timestamp });
export const updateDeviceCredential = (id, hash) => db("rooms").where({ id }).update({ device_credential_hash: hash, updated_at: db.fn.now() });
export const hasRoomCollaborator = (room_id, user_id) => db("room_collaborators").where({ room_id, user_id }).first();
