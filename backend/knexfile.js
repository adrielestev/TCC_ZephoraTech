import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { env } from "./src/config/env.js";
import NodeSqliteKnexClient from "./src/database/knex-client.js";

const backendRoot = path.dirname(fileURLToPath(import.meta.url));
const filename =
  env.DATABASE_URL === ":memory:"
    ? ":memory:"
    : path.isAbsolute(env.DATABASE_URL)
      ? env.DATABASE_URL
      : path.resolve(backendRoot, env.DATABASE_URL);
const connection = { filename };
if (connection.filename !== ":memory:") {
  fs.mkdirSync(path.dirname(path.resolve(connection.filename)), {
    recursive: true,
  });
}
const databaseConfig = {
  client: NodeSqliteKnexClient,
  connection,
  useNullAsDefault: true,
  migrations: {
    directory: path.join(backendRoot, "migrations"),
    extension: "js",
  },
  seeds: { directory: path.join(backendRoot, "seeds"), extension: "js" },
};

export default {
  development: databaseConfig,
  test: databaseConfig,
  production: databaseConfig,
};
