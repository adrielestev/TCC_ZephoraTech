import { Router } from "express";
import * as sensorsController from "../controllers/sensors.controller.js";
import { authenticate, requireAdmin } from "../middlewares/auth.js";
import {
  deviceKeyParamSchema,
  idParamSchema,
  roomIdParamSchema,
} from "../schemas/common.schemas.js";
import {
  commandSchema,
  espStateSchema,
  sensorSchema,
  updateSensorSchema,
} from "../schemas/sensors.schemas.js";
import { validate } from "../utils/validators.js";

export const sensorsRouter = Router();

sensorsRouter.get("/", authenticate, sensorsController.listSensors);
sensorsRouter.post(
  "/",
  authenticate,
  requireAdmin,
  validate(sensorSchema),
  sensorsController.createSensor,
);
sensorsRouter.get(
  "/:id",
  authenticate,
  validate(idParamSchema, "params"),
  sensorsController.getSensor,
);
sensorsRouter.patch(
  "/:id",
  authenticate,
  requireAdmin,
  validate(idParamSchema, "params"),
  validate(updateSensorSchema),
  sensorsController.updateSensor,
);
sensorsRouter.delete(
  "/:id",
  authenticate,
  requireAdmin,
  validate(idParamSchema, "params"),
  sensorsController.deleteSensor,
);
sensorsRouter.post(
  "/:id/command",
  authenticate,
  validate(idParamSchema, "params"),
  validate(commandSchema),
  sensorsController.commandSensor,
);
sensorsRouter.post(
  "/rooms/:roomId/:deviceKey/state",
  validate(roomIdParamSchema, "params"),
  validate(deviceKeyParamSchema, "params"),
  validate(espStateSchema),
  sensorsController.reportSensorState,
);
