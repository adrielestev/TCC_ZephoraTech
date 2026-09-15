import dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || "./zephora.sqlite";

export default {
  development: {
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
  },
  production: {
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
  },
};
