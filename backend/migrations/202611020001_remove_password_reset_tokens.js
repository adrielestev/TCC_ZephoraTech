export async function up(knex) {
  const users = await knex("users").columnInfo();
  if (!users.password_reset_token_hash) {
    await knex.schema.alterTable("users", (t) => {
      t.text("password_reset_token_hash");
      t.text("password_reset_expires_at");
      t.integer("password_reset_attempts").notNullable().defaultTo(0);
    });
  }

  const rooms = await knex("rooms").columnInfo();
  if (!rooms.classroom_code) {
    await knex.schema.alterTable("rooms", (t) => {
      t.text("classroom_code");
    });
    await knex.raw(
      "UPDATE rooms SET classroom_code = 'ROOM-' || id WHERE classroom_code IS NULL",
    );
    await knex.raw(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_rooms_classroom_code ON rooms(classroom_code)",
    );
  }

  if (await knex.schema.hasTable("password_reset_tokens")) {
    await knex.raw(`
      UPDATE users
      SET password_reset_token_hash = (
        SELECT token_hash FROM password_reset_tokens
        WHERE password_reset_tokens.user_id = users.id
      ),
      password_reset_expires_at = (
        SELECT expires_at FROM password_reset_tokens
        WHERE password_reset_tokens.user_id = users.id
      ),
      password_reset_attempts = COALESCE((
        SELECT attempts FROM password_reset_tokens
        WHERE password_reset_tokens.user_id = users.id
      ), 0)
      WHERE id IN (SELECT user_id FROM password_reset_tokens)
    `);
    await knex.schema.dropTable("password_reset_tokens");
  }
}

export async function down(knex) {
  if (!(await knex.schema.hasTable("password_reset_tokens"))) {
    await knex.schema.createTable("password_reset_tokens", (t) => {
      t.increments("id").primary();
      t.integer("user_id")
        .notNullable()
        .unique()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      t.text("token_hash").notNullable();
      t.text("expires_at").notNullable();
      t.integer("attempts").notNullable().defaultTo(0);
      t.text("created_at")
        .notNullable()
        .defaultTo(knex.raw("CURRENT_TIMESTAMP"));
    });
  }
}
