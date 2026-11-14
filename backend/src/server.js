"use strict";

const env = require("./config/env");
const { db } = require("./database/db");
const { createApp } = require("./app");
const esp32Repository = require("./modules/esp32/esp32.repository");
const { toSql } = require("./shared/time");

const server = createApp().listen(env.PORT, () => {
  console.log(`Zephora API em http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

// Marca como offline os ESP32 que pararam de sincronizar
const sweeper = setInterval(() => {
  try {
    esp32Repository.markStaleOffline(
      toSql(new Date(Date.now() - env.ESP32_OFFLINE_AFTER_SECONDS * 1000)),
    );
  } catch (err) {
    console.error("[esp32] falha ao atualizar status offline:", err.message);
  }
}, 15_000);
sweeper.unref();

function shutdown(signal) {
  console.log(`${signal} recebido, encerrando...`);
  clearInterval(sweeper);
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) =>
  console.error("[unhandledRejection]", reason),
);
