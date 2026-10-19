import dotenv from "dotenv";
import { mkdirSync } from "node:fs";
import path from "node:path";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || "./zephora.sqlite";

try {
  mkdirSync(path.dirname(path.resolve(databaseUrl)), { recursive: true });
} catch {
  // Ignora se não puder criar ou já existir
}

const shared = {
  client: "sqlite3",
  connection: {
    filename: databaseUrl,
  },
  useNullAsDefault: true,
  migrations: {
    directory: "./migrations",
  },
  seeds: {
    directory: "./seeds",
  },
  pool: {
    afterCreate(connection, done) {
      connection.run("PRAGMA foreign_keys = ON", done);
    },
  },
};

export default {
  development: { ...shared },
  production: { ...shared },
};
