"use strict";

// Formato do SQLite (UTC): "YYYY-MM-DD HH:MM:SS"
const toSql = (date = new Date()) =>
  date.toISOString().slice(0, 19).replace("T", " ");
const fromSql = (value) => new Date(`${value.replace(" ", "T")}Z`);

module.exports = { toSql, fromSql };
