import { env } from "../src/config/env.js";
import { hashPassword } from "../src/services/password.service.js";

export async function seed(knex) {
  const existingAdmin = await knex("users")
    .where({ email: env.INITIAL_ADMIN_EMAIL })
    .first();

  if (existingAdmin) {
    return;
  }

  await knex("users").insert({
    name: env.INITIAL_ADMIN_NAME,
    email: env.INITIAL_ADMIN_EMAIL,
    password_hash: await hashPassword(env.INITIAL_ADMIN_PASSWORD),
    is_email_verified: 1,
    user_level: "ADMIN",
  });
}
