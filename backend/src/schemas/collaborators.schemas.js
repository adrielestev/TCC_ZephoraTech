import { z } from "zod";
import { idSchema } from "./common.schemas.js";

export const addCollaboratorSchema = z.object({ user_id: idSchema }).strict();
export const collaboratorParamsSchema = z.object({ id: idSchema, collaboratorId: idSchema });
