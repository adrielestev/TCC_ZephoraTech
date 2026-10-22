import { DatabaseSync } from "node:sqlite";

/**
 * Small sqlite3-compatible surface backed by Node's built-in SQLite API.
 * Knex's SQLite dialect expects callback-based driver methods; DatabaseSync
 * keeps the actual database implementation in Node and requires no native
 * npm addon.
 */
class NodeSqliteDatabase {
  constructor(filename, _flags, callback = () => {}) {
    this.database = new DatabaseSync(filename);
    this.database.exec(
      "PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;",
    );
    queueMicrotask(() => callback(null));
  }

  all(sql, bindings = [], callback = () => {}) {
    try {
      const rows = this.database
        .prepare(sql)
        .all(...normalizeBindings(bindings));
      callback.call({}, null, rows);
    } catch (error) {
      callback(error);
    }
    return this;
  }

  run(sql, bindings = [], callback = () => {}) {
    try {
      const result = this.database
        .prepare(sql)
        .run(...normalizeBindings(bindings));
      callback.call(
        {
          lastID: Number(result.lastInsertRowid),
          changes: Number(result.changes),
        },
        null,
      );
    } catch (error) {
      callback(error);
    }
    return this;
  }

  exec(sql, callback = () => {}) {
    try {
      this.database.exec(sql);
      callback(null);
    } catch (error) {
      callback(error);
    }
    return this;
  }

  close(callback = () => {}) {
    try {
      this.database.close();
      callback(null);
    } catch (error) {
      callback(error);
    }
  }
}

function normalizeBindings(bindings) {
  if (bindings == null) return [];
  const values = Array.isArray(bindings) ? bindings : [bindings];
  return values.map((value) => {
    if (value === undefined) return null;
    if (value instanceof Date) return value.toISOString();
    return value;
  });
}

export const nodeSqliteDriver = {
  OPEN_READWRITE: 0,
  OPEN_CREATE: 1,
  Database: NodeSqliteDatabase,
};
