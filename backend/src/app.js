import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { authRouter } from "./routes/auth.routes.js";
import { collaboratorsRouter } from "./routes/collaborators.routes.js";
import { roomsRouter } from "./routes/rooms.routes.js";
import { sensorsRouter } from "./routes/sensors.routes.js";
import { usersRouter } from "./routes/users.routes.js";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler.js";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

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
