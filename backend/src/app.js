import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { apiRouter } from "./routes/index.js";
import { errorHandler, notFound } from "./middlewares/error.middleware.js";

export const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors((req, callback) => {
    const origin = req.get("Origin");
    if (!origin) return callback(null, { origin: false, credentials: false });

    let allowed = env.corsOrigins.includes(origin);
    if (!allowed && env.NODE_ENV !== "production") {
      try {
        const hostname = new URL(origin).hostname;
        const isLoopback = hostname === "localhost" || hostname === "127.0.0.1";
        allowed = isLoopback || hostname === req.hostname;
      } catch {
        allowed = false;
      }
    }

    callback(null, { origin: allowed ? origin : false, credentials: false });
  }),
);
app.use(express.json({ limit: "1mb", strict: true }));
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", apiRouter);
app.use(notFound);
app.use(errorHandler);
