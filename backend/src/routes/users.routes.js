import { Router } from "express";
import * as usersController from "../controllers/users.controller.js";
import { authenticate, requireAdmin } from "../middlewares/auth.js";
import { idParamSchema } from "../schemas/common.schemas.js";
import {
  updateMeSchema,
  updateUserLevelSchema,
} from "../schemas/users.schemas.js";
import { validate } from "../utils/validators.js";
import {
  uploadImage,
  validateUploadedImage,
} from "../middlewares/image-upload.js";

export const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.patch("/me", validate(updateMeSchema), usersController.updateMe);
usersRouter.post(
  "/me/photo",
  uploadImage,
  validateUploadedImage,
  usersController.updateMyPhoto,
);
usersRouter.delete("/me/photo", usersController.removeMyPhoto);
usersRouter.get("/", requireAdmin, usersController.listUsers);
usersRouter.patch(
  "/:id/level",
  requireAdmin,
  validate(idParamSchema, "params"),
  validate(updateUserLevelSchema),
  usersController.updateUserLevel,
);
usersRouter.delete(
  "/:id",
  requireAdmin,
  validate(idParamSchema, "params"),
  usersController.deleteUser,
);
