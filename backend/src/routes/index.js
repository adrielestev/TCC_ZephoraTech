import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { usersRouter } from "./users.routes.js";
import { roomsRouter } from "./rooms.routes.js";
import { collaboratorsRouter } from "./collaborators.routes.js";
import { devicesRouter } from "./devices.routes.js";
import { automationsRouter } from "./automations.routes.js";
import { esp32Router } from "./esp32.routes.js";
import { mediaRouter } from "./media.routes.js";

export const apiRouter = Router();
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/rooms", roomsRouter);
apiRouter.use("/rooms/:id/collaborators", collaboratorsRouter);
apiRouter.use(devicesRouter);
apiRouter.use(automationsRouter);
apiRouter.use("/device", esp32Router);
apiRouter.use("/media", mediaRouter);
