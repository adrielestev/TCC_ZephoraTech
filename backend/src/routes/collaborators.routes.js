import { Router } from "express";
import * as collaboratorsController from "../controllers/collaborators.controller.js";
import { authenticate, requireAdmin } from "../middlewares/auth.js";
import { idParamSchema, roomIdParamSchema } from "../schemas/common.schemas.js";
import { collaboratorSchema } from "../schemas/collaborators.schemas.js";
import { asyncHandler } from "../utils/async-handler.js";
import { validate } from "../utils/validators.js";

export const collaboratorsRouter = Router({ mergeParams: true });

collaboratorsRouter.use(
  authenticate,
  requireAdmin,
  validate(roomIdParamSchema, "params"),
);

collaboratorsRouter.get(
  "/",
  asyncHandler(collaboratorsController.listCollaborators),
);
collaboratorsRouter.post(
  "/",
  validate(collaboratorSchema),
  asyncHandler(collaboratorsController.createCollaborator),
);
collaboratorsRouter.delete(
  "/:id",
  validate(idParamSchema, "params"),
  asyncHandler(collaboratorsController.deleteCollaborator),
);
