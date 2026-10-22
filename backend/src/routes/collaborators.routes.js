import { Router } from "express";
import * as controller from "../controllers/collaborators.controller.js";
import { authenticateUser, requireAdmin } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { idParamSchema } from "../schemas/common.schemas.js";
import { addCollaboratorSchema, collaboratorParamsSchema } from "../schemas/collaborators.schemas.js";
import { asyncHandler } from "../utils/async-handler.js";

export const collaboratorsRouter = Router({ mergeParams: true });
collaboratorsRouter.use(authenticateUser, requireAdmin);
collaboratorsRouter.get("/", validate(idParamSchema, "params"), asyncHandler(controller.list));
collaboratorsRouter.post("/", validate(idParamSchema, "params"), validate(addCollaboratorSchema), asyncHandler(controller.add));
collaboratorsRouter.delete("/:collaboratorId", validate(collaboratorParamsSchema, "params"), asyncHandler(controller.remove));
