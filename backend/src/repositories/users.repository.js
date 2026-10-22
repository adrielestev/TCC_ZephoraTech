import { db } from "../db.js";

export const findByEmail = (email) => db("users").where({ email }).first();
export const findActiveById = (id) =>
  db("users").where({ id }).whereNull("deleted_at").first();
export const createUser = (user) => db("users").insert(user);
export const updateUser = (id, data, executor = db) =>
  executor("users").where({ id }).update(data);
export const incrementVerificationAttempts = (id) =>
  db("users")
    .where({ id })
    .where("verification_attempts", "<", 5)
    .increment("verification_attempts", 1);
export const listActiveUsers = () =>
  db("users")
    .whereNull("deleted_at")
    .select(
      "id",
      "name",
      "email",
      "user_level",
      "is_email_verified",
      "user_photo",
      "created_at",
    );
