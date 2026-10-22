export async function up(knex) {
  await knex.schema.createTable("rooms", (t) => {
    t.increments("id").primary();
    t.text("name").notNullable();
    t.text("mac_address").notNullable().unique();
    t.text("device_credential_hash").unique();
    t.text("last_seen_at");
    t.text("room_photo_1");
    t.text("room_photo_2");
    t.text("room_photo_3");
    t.text("created_at").notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP"));
    t.text("updated_at").notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP"));
  });
  await knex.raw(`CREATE TRIGGER rooms_mac_required_insert
    BEFORE INSERT ON rooms
    WHEN length(trim(NEW.mac_address)) = 0
    BEGIN
      SELECT RAISE(ABORT, 'rooms mac_address is required');
    END`);
  await knex.raw(`CREATE TRIGGER rooms_mac_required_update
    BEFORE UPDATE OF mac_address ON rooms
    WHEN length(trim(NEW.mac_address)) = 0
    BEGIN
      SELECT RAISE(ABORT, 'rooms mac_address is required');
    END`);
  await knex.schema.createTable("users", (t) => {
    t.increments("id").primary();
    t.text("name").notNullable();
    t.text("email").notNullable().unique();
    t.text("password_hash").notNullable();
    t.integer("is_email_verified").notNullable().defaultTo(0);
    t.text("verification_code_hash");
    t.text("verification_expires_at");
    t.integer("verification_attempts").notNullable().defaultTo(0);
    t.text("last_code_sent_at");
    t.text("user_level").notNullable().defaultTo("user");
    t.text("user_photo");
    t.text("deleted_at");
    t.text("created_at").notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP"));
    t.text("updated_at").notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP"));
    t.check("is_email_verified IN (0, 1)");
    t.check("verification_attempts >= 0");
    t.check("user_level IN ('user', 'admin')");
  });
  await knex.schema.createTable("room_collaborators", (t) => {
    t.increments("id").primary();
    t.integer("room_id")
      .notNullable()
      .references("id")
      .inTable("rooms")
      .onDelete("CASCADE");
    t.integer("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    t.integer("added_by")
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");
    t.text("created_at").notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP"));
    t.unique(["room_id", "user_id"], "idx_room_collaborators_unique");
    t.index("user_id", "idx_room_collaborators_user");
  });
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
    t.text("created_at").notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP"));
    t.index("expires_at", "idx_password_reset_expires");
  });
  await knex.schema.createTable("sensors", (t) => {
    t.increments("id").primary();
    t.integer("room_id")
      .notNullable()
      .references("id")
      .inTable("rooms")
      .onDelete("CASCADE");
    t.text("name").notNullable();
    t.text("direction").notNullable();
    t.text("type").notNullable();
    t.integer("pin");
    t.text("config_json");
    t.text("state_labels_json");
    t.text("value_unit");
    t.float("current_state");
    t.float("desired_state");
    t.text("created_at").notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP"));
    t.text("updated_at").notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP"));
    t.check("direction IN ('input', 'output')");
    t.check("type IN ('relay', 'pwm', 'temperature', 'presence', 'contact')");
    t.index("room_id", "idx_sensors_room");
  });
  await knex.raw(
    "CREATE UNIQUE INDEX idx_sensors_room_pin ON sensors(room_id, pin) WHERE pin IS NOT NULL",
  );
  await knex.schema.createTable("automation_rules", (t) => {
    t.increments("id").primary();
    t.text("name").notNullable();
    t.integer("source_sensor_id")
      .notNullable()
      .references("id")
      .inTable("sensors")
      .onDelete("CASCADE");
    t.text("operator").notNullable();
    t.float("comparison_value").notNullable();
    t.integer("target_sensor_id")
      .notNullable()
      .references("id")
      .inTable("sensors")
      .onDelete("CASCADE");
    t.float("target_value").notNullable();
    t.integer("is_enabled").notNullable().defaultTo(1);
    t.integer("cooldown_seconds").notNullable().defaultTo(0);
    t.integer("restore_previous").notNullable().defaultTo(0);
    t.integer("is_active").notNullable().defaultTo(0);
    t.float("previous_target_value");
    t.text("created_at").notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP"));
    t.text("updated_at").notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP"));
    t.check("operator IN ('eq', 'ne', 'gt', 'gte', 'lt', 'lte')");
    t.check("source_sensor_id <> target_sensor_id");
    t.check("is_enabled IN (0, 1)");
    t.check("cooldown_seconds >= 0");
    t.index("source_sensor_id", "idx_automation_source");
    t.index("target_sensor_id", "idx_automation_target");
  });
  await knex.raw(
    "CREATE UNIQUE INDEX idx_automation_active_target ON automation_rules(target_sensor_id) WHERE restore_previous = 1 AND is_active = 1 AND is_enabled = 1",
  );
  await knex.raw(`CREATE TRIGGER automation_rules_validate_insert BEFORE INSERT ON automation_rules
    BEGIN
      SELECT CASE WHEN (SELECT direction FROM sensors WHERE id = NEW.source_sensor_id) <> 'input'
        THEN RAISE(ABORT, 'automation source must be input') END;
      SELECT CASE WHEN (SELECT direction FROM sensors WHERE id = NEW.target_sensor_id) <> 'output'
        THEN RAISE(ABORT, 'automation target must be output') END;
      SELECT CASE WHEN (SELECT room_id FROM sensors WHERE id = NEW.source_sensor_id) <> (SELECT room_id FROM sensors WHERE id = NEW.target_sensor_id)
        THEN RAISE(ABORT, 'automation sensors must belong to same room') END;
    END`);
  await knex.raw(`CREATE TRIGGER automation_rules_validate_update BEFORE UPDATE ON automation_rules
    BEGIN
      SELECT CASE WHEN (SELECT direction FROM sensors WHERE id = NEW.source_sensor_id) <> 'input'
        THEN RAISE(ABORT, 'automation source must be input') END;
      SELECT CASE WHEN (SELECT direction FROM sensors WHERE id = NEW.target_sensor_id) <> 'output'
        THEN RAISE(ABORT, 'automation target must be output') END;
      SELECT CASE WHEN (SELECT room_id FROM sensors WHERE id = NEW.source_sensor_id) <> (SELECT room_id FROM sensors WHERE id = NEW.target_sensor_id)
        THEN RAISE(ABORT, 'automation sensors must belong to same room') END;
    END`);
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("password_reset_tokens");
  await knex.schema.dropTableIfExists("automation_rules");
  await knex.schema.dropTableIfExists("sensors");
  await knex.schema.dropTableIfExists("room_collaborators");
  await knex.schema.dropTableIfExists("users");
  await knex.schema.dropTableIfExists("rooms");
}
