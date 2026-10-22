import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import { app } from "./app.js";
import { db } from "./db.js";
import { env } from "./config/env.js";

const tlsOptions = env.HTTPS_KEY_FILE && env.HTTPS_CERT_FILE
  ? { key: fs.readFileSync(env.HTTPS_KEY_FILE), cert: fs.readFileSync(env.HTTPS_CERT_FILE) }
  : null;
const server = tlsOptions ? https.createServer(tlsOptions, app) : http.createServer(app);
server.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Zephora API ouvindo em ${tlsOptions ? "https" : "http"} na porta ${env.PORT}`);
});

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Encerrando API (${signal})`);
  server.close(async (error) => {
    if (error) console.error(error);
    await db.destroy();
    process.exitCode = error ? 1 : 0;
  });
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
