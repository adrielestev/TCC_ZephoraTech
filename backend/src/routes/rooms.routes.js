import { Router } from "express";
import * as roomsController from "../controllers/rooms.controller.js";
import { authenticate, requireAdmin } from "../middlewares/auth.js";
import { idParamSchema, roomIdParamSchema } from "../schemas/common.schemas.js";
import {
  commandsQuerySchema,
  handshakeSchema,
  roomSchema,
  updateRoomSchema,
} from "../schemas/rooms.schemas.js";
import { asyncHandler } from "../utils/async-handler.js";
import { validate } from "../utils/validators.js";
import { uploadImage, validateUploadedImage } from "../middlewares/image-upload.js";
import { z } from "zod";

const photoParamsSchema = idParamSchema.extend({
  slot: z.coerce.number().int().min(1).max(3),
});

export const roomsRouter = Router();

roomsRouter.get("/", authenticate, asyncHandler(roomsController.listRooms));
roomsRouter.post(
  "/",
  authenticate,
  requireAdmin,
  validate(roomSchema),
  asyncHandler(roomsController.createRoom),
);
roomsRouter.get(
  "/:id",
  authenticate,
  validate(idParamSchema, "params"),
  asyncHandler(roomsController.getRoom),
);
roomsRouter.patch(
  "/:id",
  authenticate,
  requireAdmin,
  validate(idParamSchema, "params"),
  validate(updateRoomSchema),
  asyncHandler(roomsController.updateRoom),
);
roomsRouter.post(
  "/:id/photos/:slot",
  authenticate,
  requireAdmin,
  validate(photoParamsSchema, "params"),
  uploadImage,
  validateUploadedImage,
  asyncHandler(roomsController.updateRoomPhoto),
);
roomsRouter.delete(
  "/:id/photos/:slot",
  authenticate,
  requireAdmin,
  validate(photoParamsSchema, "params"),
  asyncHandler(roomsController.removeRoomPhoto),
);
roomsRouter.delete(
  "/:id",
  authenticate,
  requireAdmin,
  validate(idParamSchema, "params"),
  asyncHandler(roomsController.deleteRoom),
);
roomsRouter.post(
  "/:id/handshake",
  validate(idParamSchema, "params"),
  validate(handshakeSchema),
  asyncHandler(roomsController.handshake),
);
roomsRouter.get(
  "/:roomId/commands",
  validate(roomIdParamSchema, "params"),
  validate(commandsQuerySchema, "query"),
  asyncHandler(roomsController.listCommands),
);
