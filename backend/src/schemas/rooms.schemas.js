import { z } from "zod";
import { macAddressSchema } from "./common.schemas.js";

export const roomSchema = z.object({
  name: z.string().trim().min(2).max(120),
  classroom_code: z.string().trim().min(1).max(40).toUpperCase(),
  mac_address: macAddressSchema,
  room_photo_1: z.string().url().nullable().optional(),
  room_photo_2: z.string().url().nullable().optional(),
  room_photo_3: z.string().url().nullable().optional(),
});

export const updateRoomSchema = roomSchema.partial();