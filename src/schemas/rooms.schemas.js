import { z } from "zod";
import { macAddressSchema } from "./common.schemas.js";

export const roomSchema = z.object({
  name: z.string().trim().min(2).max(120),
  classroom_code: z.string().trim().min(1).max(40).toUpperCase(),
  mac_address: macAddressSchema,
  room_photo_1: z.string().url().nullable().optional(),
  room_photo_2: z.string().url().nullable().optional(),
  room_photo_3: z.string().url().nullable().optional()
});

export const updateRoomSchema = roomSchema.partial();

export const handshakeSchema = z.object({
  user_id: z.coerce.number().int().positive(),
  room_id: z.coerce.number().int().positive(),
  mac_address: macAddressSchema
});

export const commandsQuerySchema = z.object({
  mac_address: macAddressSchema
});
