import { Router } from "express";
import * as controller from "../controllers/devices.controller.js";
import { authenticateUser, requireAdmin } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { idParamSchema } from "../schemas/common.schemas.js";
import { deviceSchema, stateSchema, updateDeviceSchema } from "../schemas/devices.schemas.js";
import { asyncHandler } from "../utils/async-handler.js";

export const devicesRouter = Router();
devicesRouter.get("/rooms/:id/devices", authenticateUser, validate(idParamSchema, "params"), asyncHandler(controller.listForRoom));
devicesRouter.post("/rooms/:id/devices", authenticateUser, requireAdmin, validate(idParamSchema, "params"), validate(deviceSchema), asyncHandler(controller.create));
devicesRouter.patch("/devices/:id", authenticateUser, requireAdmin, validate(idParamSchema, "params"), validate(updateDeviceSchema), asyncHandler(controller.update));
devicesRouter.delete("/devices/:id", authenticateUser, requireAdmin, validate(idParamSchema, "params"), asyncHandler(controller.remove));
devicesRouter.post("/devices/:id/command", authenticateUser, validate(idParamSchema, "params"), validate(stateSchema), asyncHandler(controller.command));
