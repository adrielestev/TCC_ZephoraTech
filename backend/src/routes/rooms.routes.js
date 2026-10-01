import { Router } from "express";
import * as roomsController from "../controllers/rooms.controller.js";
import { authenticate, requireAdmin } from "../middlewares/auth.js";
import { authenticateDevice } from "../middlewares/device-auth.js";
import { idParamSchema, roomIdParamSchema } from "../schemas/common.schemas.js";
import { roomSchema, updateRoomSchema } from "../schemas/rooms.schemas.js";
import { validate } from "../utils/validators.js";
import {
  uploadImage,
  validateUploadedImage,
} from "../middlewares/image-upload.js";
import { z } from "zod";

const photoParamsSchema = idParamSchema.extend({
  slot: z.coerce.number().int().min(1).max(3),
});

export const roomsRouter = Router();

roomsRouter.get("/", authenticate, roomsController.listRooms);
roomsRouter.post(
  "/",
  authenticate,
  requireAdmin,
  validate(roomSchema),
  roomsController.createRoom,
);
roomsRouter.get(
  "/:id",
  authenticate,
  validate(idParamSchema, "params"),
  roomsController.getRoom,
);
roomsRouter.patch(
  "/:id",
  authenticate,
  requireAdmin,
  validate(idParamSchema, "params"),
  validate(updateRoomSchema),
  roomsController.updateRoom,
);
roomsRouter.post(
  "/:id/photos/:slot",
  authenticate,
  requireAdmin,
  validate(photoParamsSchema, "params"),
  uploadImage,
  validateUploadedImage,
  roomsController.updateRoomPhoto,
);
roomsRouter.delete(
  "/:id/photos/:slot",
  authenticate,
  requireAdmin,
  validate(photoParamsSchema, "params"),
  roomsController.removeRoomPhoto,
);
roomsRouter.delete(
  "/:id",
  authenticate,
  requireAdmin,
  validate(idParamSchema, "params"),
  roomsController.deleteRoom,
);
roomsRouter.post(
  "/:id/device-credential",
  authenticate,
  requireAdmin,
  validate(idParamSchema, "params"),
  roomsController.generateDeviceCredential,
);
roomsRouter.post(
  "/:id/handshake",
  validate(idParamSchema, "params"),
  authenticateDevice,
  roomsController.handshake,
);
roomsRouter.get(
  "/:roomId/commands",
  validate(roomIdParamSchema, "params"),
  authenticateDevice,
  roomsController.listCommands,
);
