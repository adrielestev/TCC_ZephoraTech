import { db } from "../db.js";

export const findUserPhotoReference = (filename) => db("users")
  .where({ user_photo: filename }).whereNull("deleted_at").select("id").first();

export const findRoomPhotoReference = (filename) => db("rooms").where((query) => query
  .where("room_photo_1", filename).orWhere("room_photo_2", filename).orWhere("room_photo_3", filename))
  .select("id").first();
