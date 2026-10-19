import { Router } from "express";
import * as roomsController from "../controllers/rooms.controller.js";
import * as sensorsController from "../controllers/sensors.controller.js";
import { authenticateDevice } from "../middlewares/device-auth.js";
import { deviceKeyParamSchema } from "../schemas/common.schemas.js";
import { espStateSchema } from "../schemas/sensors.schemas.js";
import { validate } from "../utils/validators.js";

export const deviceRouter = Router();

deviceRouter.post("/handshake", authenticateDevice, roomsController.handshake);
deviceRouter.get("/commands", authenticateDevice, roomsController.listCommands);
deviceRouter.post(
  "/sensors/:deviceKey/state",
  validate(deviceKeyParamSchema, "params"),
  authenticateDevice,
  validate(espStateSchema),
  sensorsController.reportSensorState,
);
