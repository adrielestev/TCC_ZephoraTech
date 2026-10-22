import { db } from "../db.js";

export const listForRoom = (roomId) => db("room_collaborators")
  .join("users", "users.id", "room_collaborators.user_id")
  .where("room_collaborators.room_id", roomId)
  .select("room_collaborators.id", "room_collaborators.room_id", "room_collaborators.user_id", "room_collaborators.added_by", "room_collaborators.created_at", "users.name", "users.email");
export const findById = (id) => db("room_collaborators").where({ id }).first();
export const add = (room_id, user_id, added_by) => db("room_collaborators").insert({ room_id, user_id, added_by });
export const remove = (id, room_id) => db("room_collaborators").where({ id, room_id }).del();
