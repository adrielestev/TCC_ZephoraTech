import { db } from "../db/connection.js";

export function listRoomsForUser(user) {
  const query = db("rooms").select("rooms.*").orderBy("rooms.name");

  if (user.user_level !== "ADMIN") {
    query
      .join("room_collaborators", "room_collaborators.room_id", "rooms.id")
      .where("room_collaborators.user_id", user.id);
  }

  return query;
}

export function findRoomById(id) {
  return db("rooms").where({ id }).first();
}

export function findRoomByIdAndMac(id, macAddress) {
  return db("rooms").where({ id, mac_address: macAddress }).first();
}

export async function createRoom(payload) {
  const [id] = await db("rooms").insert(payload);
  return findRoomById(id);
}

export async function updateRoom(id, payload) {
  const updated = await db("rooms").where({ id }).update(payload);
  return updated ? findRoomById(id) : null;
}

export function deleteRoom(id) {
  return db("rooms").where({ id }).delete();
}

export function touchRoomLastSeen(id, lastSeenAt) {
  return db("rooms").where({ id }).update({ last_seen_at: lastSeenAt });
}
