const nowSql = "strftime('%Y-%m-%dT%H:%M:%SZ','now')";

export async function up(knex) {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.text("name").notNullable();
    table.text("email").notNullable().unique();
    table.text("password_hash").notNullable();
    table.integer("is_email_verified").notNullable().defaultTo(0);
    table.text("verification_code_hash");
    table.text("verification_expires_at");
    table.integer("verification_attempts").notNullable().defaultTo(0);
    table.text("last_code_sent_at");
    table.text("user_level").notNullable().defaultTo("USER");
    table.text("user_photo").defaultTo(null);
    table.text("deleted_at").defaultTo(null);
    table.text("created_at").notNullable().defaultTo(knex.raw(`(${nowSql})`));
    table.text("updated_at").notNullable().defaultTo(knex.raw(`(${nowSql})`));
    table.check("?? IN (0, 1)", ["is_email_verified"]);
    table.check("?? IN ('USER', 'ADMIN')", ["user_level"]);
    table.index(["name"], "idx_user_name");
  });

  await knex.schema.createTable("rooms", (table) => {
    table.increments("id").primary();
    table.text("name").notNullable();
    table.text("classroom_code").notNullable().unique();
    table.text("mac_address").notNullable().unique();
    table.text("last_seen_at");
    table.text("room_photo_1").defaultTo(null);
    table.text("room_photo_2").defaultTo(null);
    table.text("room_photo_3").defaultTo(null);
    table.text("created_at").notNullable().defaultTo(knex.raw(`(${nowSql})`));
    table.text("updated_at").notNullable().defaultTo(knex.raw(`(${nowSql})`));
  });

  await knex.schema.createTable("room_collaborators", (table) => {
    table.increments("id").primary();
    table.integer("room_id").notNullable().references("id").inTable("rooms").onDelete("CASCADE");
    table.integer("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.integer("added_by").references("id").inTable("users").onDelete("SET NULL");
    table.text("created_at").notNullable().defaultTo(knex.raw(`(${nowSql})`));
    table.unique(["room_id", "user_id"], { indexName: "uq_room_collaborator" });
    table.index(["user_id"], "idx_collab_user_id");
    table.index(["room_id"], "idx_collab_room_id");
  });

  await knex.schema.createTable("sensors", (table) => {
    table.increments("id").primary();
    table.integer("room_id").notNullable().references("id").inTable("rooms").onDelete("CASCADE");
    table.text("name").notNullable();
    table.text("device_key").notNullable();
    table.text("direction").notNullable();
    table.text("type").notNullable();
    table.text("type_of_control").notNullable();
    table.integer("pin").notNullable();
    table.integer("pin_pwm");
    table.float("current_state").notNullable().defaultTo(0);
    table.text("created_at").notNullable().defaultTo(knex.raw(`(${nowSql})`));
    table.text("updated_at").notNullable().defaultTo(knex.raw(`(${nowSql})`));
    table.check("?? IN ('INPUT', 'OUTPUT')", ["direction"]);
    table.check("?? IN ('RELE', 'SERVO', 'PWM', 'REED_SWITCH')", ["type"]);
    table.check("?? IN ('DIGITAL', 'ANALOGICO')", ["type_of_control"]);
    table.check("?? BETWEEN 0 AND 39", ["pin"]);
    table.check("?? IS NULL OR ?? BETWEEN 0 AND 39", ["pin_pwm", "pin_pwm"]);
    table.check("?? BETWEEN 0 AND 100", ["current_state"]);
    table.unique(["room_id", "pin"], { indexName: "uq_sensor_pin_per_room" });
    table.unique(["room_id", "device_key"], { indexName: "uq_sensor_device_key_per_room" });
  });

  await knex.raw(`
    CREATE TRIGGER trg_users_updated_at
    AFTER UPDATE ON users
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
    BEGIN
      UPDATE users SET updated_at = (${nowSql}) WHERE id = OLD.id;
    END;
  `);

  await knex.raw(`
    CREATE TRIGGER trg_rooms_updated_at
    AFTER UPDATE ON rooms
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
    BEGIN
      UPDATE rooms SET updated_at = (${nowSql}) WHERE id = OLD.id;
    END;
  `);

  await knex.raw(`
    CREATE TRIGGER trg_sensors_updated_at
    AFTER UPDATE ON sensors
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
    BEGIN
      UPDATE sensors SET updated_at = (${nowSql}) WHERE id = OLD.id;
    END;
  `);
}

export async function down(knex) {
  await knex.raw("DROP TRIGGER IF EXISTS trg_sensors_updated_at");
  await knex.raw("DROP TRIGGER IF EXISTS trg_rooms_updated_at");
  await knex.raw("DROP TRIGGER IF EXISTS trg_users_updated_at");
  await knex.schema.dropTableIfExists("sensors");
  await knex.schema.dropTableIfExists("room_collaborators");
  await knex.schema.dropTableIfExists("rooms");
  await knex.schema.dropTableIfExists("users");
}
