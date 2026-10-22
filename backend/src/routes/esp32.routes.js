import { Router } from "express";
import * as controller from "../controllers/esp32.controller.js";
import { authenticateDevice } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { idParamSchema } from "../schemas/common.schemas.js";
import { stateSchema } from "../schemas/devices.schemas.js";
import { asyncHandler } from "../utils/async-handler.js";
import { deviceHandshakeLimiter } from "../middlewares/rate-limit.middleware.js";

export const esp32Router = Router();
esp32Router.post("/handshake", deviceHandshakeLimiter, asyncHandler(controller.handshake));
esp32Router.get("/commands", authenticateDevice, asyncHandler(controller.commands));
esp32Router.post("/devices/:id/state", authenticateDevice, validate(idParamSchema, "params"), validate(stateSchema), asyncHandler(controller.reportState));
