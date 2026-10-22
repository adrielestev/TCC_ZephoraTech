import { Router } from "express";
import * as controller from "../controllers/automations.controller.js";
import {
  authenticateUser,
  requireAdmin,
} from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { idParamSchema } from "../schemas/common.schemas.js";
import {
  automationSchema,
  updateAutomationSchema,
} from "../schemas/automations.schemas.js";
import { asyncHandler } from "../utils/async-handler.js";

export const automationsRouter = Router();
automationsRouter.get(
  "/rooms/:id/automations",
  authenticateUser,
  validate(idParamSchema, "params"),
  asyncHandler(controller.listForRoom),
);
automationsRouter.post(
  "/rooms/:id/automations",
  authenticateUser,
  requireAdmin,
  validate(idParamSchema, "params"),
  validate(automationSchema),
  asyncHandler(controller.create),
);
automationsRouter.patch(
  "/automations/:id",
  authenticateUser,
  requireAdmin,
  validate(idParamSchema, "params"),
  validate(updateAutomationSchema),
  asyncHandler(controller.update),
);
automationsRouter.delete(
  "/automations/:id",
  authenticateUser,
  requireAdmin,
  validate(idParamSchema, "params"),
  asyncHandler(controller.remove),
);
