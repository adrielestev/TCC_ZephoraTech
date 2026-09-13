import { db } from "../db/connection.js";

const safeColumns = [
  "id",
  "name",
  "email",
  "is_email_verified",
  "user_level",
  "user_photo",
  "deleted_at",
  "created_at",
  "updated_at"
];

export function findUserById(id) {
  return db("users").where({ id }).first();
}

export function findActiveUserById(id) {
  return db("users").where({ id }).whereNull("deleted_at").first();
}

export function findUserByEmail(email) {
  return db("users").where({ email }).first();
}

export function findActiveUserByEmail(email) {
  return db("users").where({ email }).whereNull("deleted_at").first();
}

export async function createUser(payload) {
  const [id] = await db("users").insert(payload);
  return findUserById(id);
}

export async function updateUser(id, payload) {
  await db("users").where({ id }).update(payload);
  return findUserById(id);
}

export function incrementVerificationAttempts(id) {
  return db("users").where({ id }).increment("verification_attempts", 1);
}

export function listUsers() {
  return db("users").select(safeColumns).orderBy("name");
}

export async function updateActiveUser(id, payload) {
  const updated = await db("users").where({ id }).whereNull("deleted_at").update(payload);
  return updated ? findUserById(id) : null;
}

export function softDeleteUser(id, deletedAt) {
  return db("users").where({ id }).whereNull("deleted_at").update({ deleted_at: deletedAt });
}
