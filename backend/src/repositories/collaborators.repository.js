import { db } from "../db/connection.js";

export function findRoomCollaborator(roomId, userId) {
  return db("room_collaborators")
    .where({ room_id: roomId, user_id: userId })
    .first();
}

export function listRoomCollaborators(roomId) {
  return db("room_collaborators")
    .join("users", "users.id", "room_collaborators.user_id")
    .leftJoin("users as admins", "admins.id", "room_collaborators.added_by")
    .where("room_collaborators.room_id", roomId)
    .select(
      "room_collaborators.id",
      "room_collaborators.room_id",
      "room_collaborators.user_id",
      "room_collaborators.created_at",
      "users.name",
      "users.email",
      "admins.name as added_by_name",
    )
    .orderBy("users.name");
}

export async function createRoomCollaborator(payload) {
  const [id] = await db("room_collaborators").insert(payload);
  return db("room_collaborators").where({ id }).first();
}

export function deleteRoomCollaborator(id, roomId) {
  return db("room_collaborators").where({ id, room_id: roomId }).delete();
}
