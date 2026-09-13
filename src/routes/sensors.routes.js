import { Router } from "express";
import * as sensorsController from "../controllers/sensors.controller.js";
import { authenticate, requireAdmin } from "../middlewares/auth.js";
import {
  deviceKeyParamSchema,
  idParamSchema,
  roomIdParamSchema
} from "../schemas/common.schemas.js";
import {
  commandSchema,
  espStateSchema,
  sensorSchema,
  updateSensorSchema
} from "../schemas/sensors.schemas.js";
import { asyncHandler } from "../utils/async-handler.js";
import { validate } from "../utils/validators.js";

export const sensorsRouter = Router();

sensorsRouter.get("/", authenticate, asyncHandler(sensorsController.listSensors));
sensorsRouter.post("/", authenticate, requireAdmin, validate(sensorSchema), asyncHandler(sensorsController.createSensor));
sensorsRouter.get(
  "/:id",
  authenticate,
  validate(idParamSchema, "params"),
  asyncHandler(sensorsController.getSensor)
);
sensorsRouter.patch(
  "/:id",
  authenticate,
  requireAdmin,
  validate(idParamSchema, "params"),
  validate(updateSensorSchema),
  asyncHandler(sensorsController.updateSensor)
);
sensorsRouter.delete(
  "/:id",
  authenticate,
  requireAdmin,
  validate(idParamSchema, "params"),
  asyncHandler(sensorsController.deleteSensor)
);
sensorsRouter.post(
  "/:id/command",
  authenticate,
  validate(idParamSchema, "params"),
  validate(commandSchema),
  asyncHandler(sensorsController.commandSensor)
);
sensorsRouter.post(
  "/rooms/:roomId/:deviceKey/state",
  validate(roomIdParamSchema, "params"),
  validate(deviceKeyParamSchema, "params"),
  validate(espStateSchema),
  asyncHandler(sensorsController.reportSensorState)
);
