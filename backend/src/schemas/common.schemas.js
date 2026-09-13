import { z } from "zod";

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const roomIdParamSchema = z.object({
  roomId: z.coerce.number().int().positive()
});

export const deviceKeyParamSchema = z.object({
  deviceKey: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]+$/, "device_key deve conter apenas letras minusculas, numeros e underline.")
});

export const macAddressSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/, "MAC address deve usar o formato AA:BB:CC:DD:EE:FF.");

export const deviceKeySchema = deviceKeyParamSchema.shape.deviceKey;
