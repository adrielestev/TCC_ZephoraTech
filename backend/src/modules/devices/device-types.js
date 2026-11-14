"use strict";

const { z } = require("zod");
const AppError = require("../../shared/errors");

/**
 * Catálogo de tipos de aparelho. Para suportar um novo tipo:
 * 1) adicione aqui; 2) inclua o valor no CHECK de `devices.type` em schema.sql.
 */
const DEVICE_TYPES = Object.freeze({
  light: {
    label: "Luz",
    controllable: true,
    stateSchema: z.object({ on: z.boolean() }).strict(),
  },
  presence_sensor: {
    label: "Sensor de presença",
    controllable: false,
    stateSchema: z.object({ presence: z.boolean() }).strict(),
  },
});

const TYPE_NAMES = Object.keys(DEVICE_TYPES);
const isControllable = (type) => DEVICE_TYPES[type]?.controllable ?? false;

/** Valida e normaliza o estado de um tipo. `partial` serve para condições de gatilho. */
function parseState(type, value, { partial = false } = {}) {
  const base = DEVICE_TYPES[type].stateSchema;
  const schema = partial
    ? base
        .partial()
        .refine((o) => Object.keys(o).length > 0, "Informe ao menos um campo")
    : base;
  const result = schema.safeParse(value);
  if (!result.success) {
    throw AppError.badRequest(
      `Estado inválido para aparelho do tipo ${type}`,
      "INVALID_DEVICE_STATE",
      result.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    );
  }
  return result.data;
}

/** Versão que não lança: devolve null se o estado reportado for inválido. */
function safeParseState(type, value) {
  const result = DEVICE_TYPES[type].stateSchema.safeParse(value);
  return result.success ? result.data : null;
}

module.exports = {
  DEVICE_TYPES,
  TYPE_NAMES,
  isControllable,
  parseState,
  safeParseState,
};
