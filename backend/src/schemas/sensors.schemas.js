import { z } from "zod";
import { deviceKeySchema } from "./common.schemas.js";
import { SENSOR_RULES } from "../config/constants.js";

const sensorBaseSchema = z.object({
  room_id: z.coerce.number().int().positive(),
  name: z.string().trim().min(2).max(120),
  device_key: deviceKeySchema,
  direction: z.enum(["INPUT", "OUTPUT"]),
  type: z.enum(["RELE", "SERVO", "PWM", "REED_SWITCH"]),
  type_of_control: z.enum(["DIGITAL", "ANALOGICO"]),
  pin: z.coerce.number().int().min(0).max(39),
  pin_pwm: z.coerce.number().int().min(0).max(39).nullable().optional(),
  current_state: z.coerce.number().min(0).max(100).optional(),
});

export const sensorSchema = sensorBaseSchema.superRefine((sensor, context) => {
  const rule = SENSOR_RULES[sensor.type];

  if (
    sensor.direction !== rule.direction ||
    sensor.type_of_control !== rule.control
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["type"],
      message: "Tipo, direção e controle são incompatíveis.",
    });
  }

  if (!rule.usesPwmPin && sensor.pin_pwm != null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["pin_pwm"],
      message: "Este tipo de sensor não utiliza pino PWM.",
    });
  }
});

export const updateSensorSchema = sensorBaseSchema
  .omit({ room_id: true })
  .partial();

export const commandSchema = z.object({
  current_state: z.coerce.number().min(0).max(100),
});

export const espStateSchema = z.object({
  current_state: z.coerce.number().min(0).max(100),
});
