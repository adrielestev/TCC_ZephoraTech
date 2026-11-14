"use strict";

const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const env = require("./config/env");
const routes = require("./routes");
const { globalExceptSync } = require("./shared/middlewares/rateLimiters");
const {
  notFoundHandler,
  errorHandler,
} = require("./shared/middlewares/errorHandler");

function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", env.TRUST_PROXY);

  // CORP cross-origin: o app web (outra origem) precisa carregar as fotos de /uploads
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use(
    "/uploads",
    express.static(env.UPLOAD_DIR, {
      dotfiles: "deny",
      index: false,
      redirect: false,
      maxAge: "7d",
      immutable: true,
    }),
  );

  app.use("/api", globalExceptSync, routes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
