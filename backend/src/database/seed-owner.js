'use strict';

// Cria o owner (admin padrão). Seguro para rodar mais de uma vez.
// Uso: OWNER_EMAIL=... OWNER_PASSWORD=... npm run db:seed

const bcrypt = require('bcryptjs');
const { z } = require('zod');
const env = require('../config/env');
const { db } = require('./db');
const { nameField, emailField, passwordField } = require('../shared/schemas');

async function seedOwner({ name, email, password }) {
  const existing = db.prepare("SELECT id FROM users WHERE role = 'owner'").get();
  if (existing) return { created: false, id: existing.id };

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_COST);
  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO users (name, email, password_hash, role, email_verified_at)
       VALUES (?, ?, ?, 'owner', CURRENT_TIMESTAMP)`,
    )
    .run(name, email, passwordHash);
  return { created: true, id: Number(lastInsertRowid) };
}

async function main() {
  const parsed = z
    .object({ name: nameField, email: emailField, password: passwordField })
    .safeParse({
      name: process.env.OWNER_NAME || 'Administrador',
      email: process.env.OWNER_EMAIL,
      password: process.env.OWNER_PASSWORD,
    });

  if (!parsed.success) {
    console.error('Defina OWNER_EMAIL e OWNER_PASSWORD (mín. 8 caracteres):');
    for (const issue of parsed.error.issues)
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    process.exit(1);
  }

  const result = await seedOwner(parsed.data);
  console.log(
    result.created
      ? `Owner criado (id ${result.id}).`
      : `Owner já existe (id ${result.id}). Nada a fazer.`,
  );
  db.close();
}

if (require.main === module) main();

module.exports = { seedOwner };
