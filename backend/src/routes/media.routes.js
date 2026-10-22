import { Router } from "express";
import * as controller from "../controllers/media.controller.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { mediaParamsSchema } from "../schemas/media.schemas.js";
import { asyncHandler } from "../utils/async-handler.js";

export const mediaRouter = Router();
mediaRouter.get("/:filename", authenticateUser, validate(mediaParamsSchema, "params"), asyncHandler(controller.getImage));
