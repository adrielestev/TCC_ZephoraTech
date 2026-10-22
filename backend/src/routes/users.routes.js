import { Router } from "express";
import * as controller from "../controllers/users.controller.js";
import { authenticateUser, requireAdmin } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { idParamSchema } from "../schemas/common.schemas.js";
import { updateProfileSchema, updateRoleSchema } from "../schemas/users.schemas.js";
import { uploadImage, validateImageContent } from "../middlewares/image-upload.middleware.js";
import { imageUploadLimiter } from "../middlewares/rate-limit.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export const usersRouter = Router();
usersRouter.use(authenticateUser);
usersRouter.post("/me/photo", imageUploadLimiter, uploadImage, validateImageContent, asyncHandler(controller.uploadPhoto));
usersRouter.delete("/me/photo", asyncHandler(controller.deletePhoto));
usersRouter.patch("/me", validate(updateProfileSchema), asyncHandler(controller.updateMe));
usersRouter.get("/", requireAdmin, asyncHandler(controller.list));
usersRouter.patch("/:id/role", requireAdmin, validate(idParamSchema, "params"), validate(updateRoleSchema), asyncHandler(controller.updateRole));
