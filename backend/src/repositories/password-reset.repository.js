import { db } from "../db.js";

export const clearForUser = (userId, executor = db) =>
  executor("users").where({ id: userId }).update({
    password_reset_token_hash: null,
    password_reset_expires_at: null,
    password_reset_attempts: 0,
  });

export const setForUser = (userId, token, executor = db) =>
  executor("users").where({ id: userId }).update({
    password_reset_token_hash: token.token_hash,
    password_reset_expires_at: token.expires_at,
    password_reset_attempts: token.attempts,
  });

export const findForUser = (userId) =>
  db("users")
    .where({ id: userId })
    .select(
      "password_reset_token_hash as token_hash",
      "password_reset_expires_at as expires_at",
      "password_reset_attempts as attempts",
    )
    .first();

export const incrementAttempts = (userId) =>
  db("users")
    .where({ id: userId })
    .where("password_reset_attempts", "<", 5)
    .increment("password_reset_attempts", 1);

export const consume = (userId, tokenHash, now, executor = db) =>
  executor("users")
    .where({ id: userId, password_reset_token_hash: tokenHash })
    .where("password_reset_expires_at", ">", now)
    .where("password_reset_attempts", "<", 5)
    .update({
      password_reset_token_hash: null,
      password_reset_expires_at: null,
      password_reset_attempts: 0,
    });
