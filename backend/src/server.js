import { mkdirSync } from "node:fs";
import path from "node:path";
import { app } from "./app.js";
import { env } from "./config/env.js";

// Cria os diretórios configurados. No App Service, ambos ficam em /home,
// que persiste entre reinicializações e implantações.
mkdirSync(path.dirname(path.resolve(env.DATABASE_URL)), { recursive: true });
mkdirSync(path.resolve(env.UPLOAD_DIR), { recursive: true });

app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Zephora API ouvindo na porta ${env.PORT}`);
});
