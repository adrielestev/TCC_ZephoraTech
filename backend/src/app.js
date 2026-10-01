import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.routes.js";
import { collaboratorsRouter } from "./routes/collaborators.routes.js";
import { roomsRouter } from "./routes/rooms.routes.js";
import { sensorsRouter } from "./routes/sensors.routes.js";
import { usersRouter } from "./routes/users.routes.js";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler.js";
import { authorizeSignedMediaRequest } from "./services/file-storage.service.js";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(
  morgan((tokens, req, res) =>
    [
      tokens.method(req, res),
      req.path,
      tokens.status(req, res),
      tokens.res(req, res, "content-length"),
      `- ${tokens["response-time"](req, res)} ms`,
    ].join(" "),
  ),
);
app.use(
  "/uploads",
  authorizeSignedMediaRequest,
  express.static(path.resolve(process.cwd(), env.UPLOAD_DIR), {
    setHeaders(res) {
      res.setHeader("Cache-Control", "private, max-age=300");
    },
  }),
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/rooms/:roomId/collaborators", collaboratorsRouter);
app.use("/rooms", roomsRouter);
app.use("/sensors", sensorsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
