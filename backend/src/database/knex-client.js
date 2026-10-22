import Sqlite3Client from "knex/lib/dialects/sqlite3/index.js";
import { nodeSqliteDriver } from "./node-sqlite-driver.js";

/** SQLite dialect for Knex with Node 24's built-in node:sqlite driver. */
export default class NodeSqliteKnexClient extends Sqlite3Client {
  _driver() {
    return nodeSqliteDriver;
  }
}
