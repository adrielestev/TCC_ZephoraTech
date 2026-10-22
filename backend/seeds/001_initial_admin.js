import bcrypt from "bcryptjs";

export async function seed(knex) {
  const email = (process.env.INITIAL_ADMIN_EMAIL || "admin@zephora.local").trim().toLowerCase();
  const initialPassword = process.env.INITIAL_ADMIN_PASSWORD || "ChangeMe123!";
  if (process.env.NODE_ENV === "production" && (initialPassword.length < 12 || initialPassword === "ChangeMe123!")) {
    throw new Error("Defina INITIAL_ADMIN_PASSWORD com pelo menos 12 caracteres únicos em produção");
  }
  const existing = await knex("users").where({ email }).first();
  if (existing) return;
  await knex("users").insert({
    name: process.env.INITIAL_ADMIN_NAME || "Administrador",
    email,
    password_hash: await bcrypt.hash(initialPassword, 12),
    is_email_verified: 1,
    user_level: "admin",
  });
}
