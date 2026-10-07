import { mkdirSync } from "node:fs";
import path from "node:path";
import { app } from "./app.js";
import { env } from "./config/env.js";

// Garante que o diretório do banco persista na Azure (/home/data/)
if (env.DATABASE_URL.startsWith("/home/")) {
  mkdirSync(path.dirname(env.DATABASE_URL), { recursive: true });
}

app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Zephora API ouvindo em http://localhost:${env.PORT}`);
});
