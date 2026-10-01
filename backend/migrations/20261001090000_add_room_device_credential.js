export async function up(knex) {
  await knex.schema.alterTable("rooms", (table) => {
    table.text("device_credential_hash").nullable();
  });
}

export async function down(knex) {
  await knex.schema.alterTable("rooms", (table) => {
    table.dropColumn("device_credential_hash");
  });
}