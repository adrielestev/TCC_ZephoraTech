import { Router } from "express";
import * as usersController from "../controllers/users.controller.js";
import { authenticate, requireAdmin } from "../middlewares/auth.js";
import { idParamSchema } from "../schemas/common.schemas.js";
import {
  updateMeSchema,
  updateUserLevelSchema,
} from "../schemas/users.schemas.js";
import { asyncHandler } from "../utils/async-handler.js";
import { validate } from "../utils/validators.js";
import { uploadImage, validateUploadedImage } from "../middlewares/image-upload.js";

export const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.patch(
  "/me",
  validate(updateMeSchema),
  asyncHandler(usersController.updateMe),
);
usersRouter.post(
  "/me/photo",
  uploadImage,
  validateUploadedImage,
  asyncHandler(usersController.updateMyPhoto),
);
usersRouter.delete("/me/photo", asyncHandler(usersController.removeMyPhoto));
usersRouter.get("/", requireAdmin, asyncHandler(usersController.listUsers));
usersRouter.patch(
  "/:id/level",
  requireAdmin,
  validate(idParamSchema, "params"),
  validate(updateUserLevelSchema),
  asyncHandler(usersController.updateUserLevel),
);
usersRouter.delete(
  "/:id",
  requireAdmin,
  validate(idParamSchema, "params"),
  asyncHandler(usersController.deleteUser),
);
