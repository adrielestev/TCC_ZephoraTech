import { z } from "zod";

export const idSchema = z.coerce.number().int().positive();
export const idParamSchema = z.object({ id: idSchema });
export const roomIdParamSchema = idParamSchema.extend({ roomId: idSchema });
