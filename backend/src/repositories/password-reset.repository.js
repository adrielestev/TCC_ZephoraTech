import { db } from "../db.js";

export const deleteForUser = (user_id, executor = db) =>
  executor("password_reset_tokens").where({ user_id }).del();

export const create = (token, executor = db) =>
  executor("password_reset_tokens").insert(token);

export const findForUser = (user_id) =>
  db("password_reset_tokens").where({ user_id }).first();

export const incrementAttempts = (user_id) =>
  db("password_reset_tokens")
    .where({ user_id })
    .where("attempts", "<", 5)
    .increment("attempts", 1);

export const consume = (user_id, token_hash, now, executor = db) =>
  executor("password_reset_tokens")
    .where({ user_id, token_hash })
    .where("expires_at", ">", now)
    .where("attempts", "<", 5)
    .del();
