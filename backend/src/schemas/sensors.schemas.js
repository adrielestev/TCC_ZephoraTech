import { z } from "zod";
import { deviceKeySchema } from "./common.schemas.js";
import {
  DEFAULT_DEVICE_SETTINGS,
  isValidSensorState,
  SENSOR_RULES,
} from "../config/constants.js";

const settingsRecord = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean()]),
);

const stateLabelsSchema = z
  .object({
    active: z.string().trim().min(1).max(40).optional(),
    inactive: z.string().trim().min(1).max(40).optional(),
  })
  .strict();

const allowedSettings = {
  RELE: ["inverted"],
  SERVO: [
    "min_percent",
    "max_percent",
    "step_percent",
    "min_angle",
    "max_angle",
  ],
  PWM: [
    "min_percent",
    "max_percent",
    "step_percent",
    "frequency_hz",
    "inverted",
  ],
  REED_SWITCH: ["inverted", "debounce_ms"],
  CONTACT_SENSOR: ["inverted", "debounce_ms"],
  PIR_SENSOR: ["inverted", "debounce_ms", "hold_ms"],
  TEMPERATURE: [],
};

function validateDeviceSettings(type, settings, context) {
  for (const key of Object.keys(settings)) {
    if (!allowedSettings[type].includes(key)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["device_settings", key],
        message: `A configuração ${key} não se aplica a ${type}.`,
      });
    }
  }

  if ("inverted" in settings && typeof settings.inverted !== "boolean") {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["device_settings", "inverted"],
      message: "Informe verdadeiro ou falso.",
    });
  }

  const ranges = {
    min_percent: [0, 100],
    max_percent: [0, 100],
    step_percent: [1, 100],
    min_angle: [0, 180],
    max_angle: [0, 180],
    frequency_hz: [1, 40000],
    debounce_ms: [0, 5000],
    hold_ms: [0, 3600000],
  };
  for (const [key, [minimum, maximum]] of Object.entries(ranges)) {
    if (!(key in settings)) continue;
    const value = settings[key];
    if (
      typeof value !== "number" ||
      !Number.isInteger(value) ||
      value < minimum ||
      value > maximum
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["device_settings", key],
        message: `${key} deve ser um número inteiro entre ${minimum} e ${maximum}.`,
      });
    }
  }

  const normalized = { ...DEFAULT_DEVICE_SETTINGS[type], ...settings };
  if (
    "min_percent" in normalized &&
    normalized.min_percent > normalized.max_percent
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["device_settings", "min_percent"],
      message: "O mínimo deve ser menor ou igual ao máximo.",
    });
  }
  if (
    "min_angle" in normalized &&
    normalized.min_angle >= normalized.max_angle
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["device_settings", "min_angle"],
      message: "O ângulo mínimo deve ser menor que o máximo.",
    });
  }
}

const sensorBaseSchema = z.object({
  room_id: z.coerce.number().int().positive(),
  name: z.string().trim().min(2).max(120),
  device_key: deviceKeySchema,
  direction: z.enum(["INPUT", "OUTPUT"]),
  type: z.enum([
    "RELE",
    "SERVO",
    "PWM",
    "REED_SWITCH",
    "CONTACT_SENSOR",
    "PIR_SENSOR",
    "TEMPERATURE",
  ]),
  type_of_control: z.enum(["DIGITAL", "ANALOGICO"]),
  pin: z.coerce.number().int().min(0).max(39),
  current_state: z.coerce.number().min(-40).max(125).optional(),
  device_settings: settingsRecord.optional(),
  state_labels: stateLabelsSchema.optional(),
});

export const sensorSchema = sensorBaseSchema.superRefine((sensor, context) => {
  const rule = SENSOR_RULES[sensor.type];
  const settings = {
    ...DEFAULT_DEVICE_SETTINGS[sensor.type],
    ...(sensor.device_settings ?? {}),
  };

  validateDeviceSettings(sensor.type, sensor.device_settings ?? {}, context);

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

  if (
    sensor.current_state !== undefined &&
    !isValidSensorState(sensor.type, sensor.current_state, settings)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["current_state"],
      message:
        rule.stateEncoding === "BINARY"
          ? "Dispositivos digitais aceitam somente 0 (desligado/inativo) ou 1 (ligado/ativo)."
          : "Estado analógico fora da faixa configurada para este dispositivo.",
    });
  }
});

export const updateSensorSchema = sensorBaseSchema
  .omit({ room_id: true })
  .partial();

export const commandSchema = z.object({
  current_state: z.coerce.number().min(-40).max(125),
});

export const espStateSchema = z.object({
  current_state: z.coerce.number().min(-40).max(125),
});
