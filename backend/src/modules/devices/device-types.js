'use strict';

const { z } = require('zod');
const AppError = require('../../shared/errors');

/**
 * Catálogo de tipos de aparelho. Para suportar um novo tipo:
 * 1) adicione aqui; 2) inclua o valor no CHECK de `devices.type` em schema.sql.
 */
const DEVICE_TYPES = Object.freeze({
  light: {
    label: 'Luz',
    controllable: true,
    stateSchema: z.object({ on: z.boolean() }).strict(),
  },
  presence_sensor: {
    label: 'Sensor de presença',
    controllable: false,
    stateSchema: z.object({ presence: z.boolean() }).strict(),
    executionConfigSchema: z
      .object({
        holdMs: z.number().int().min(0).max(3600000),
        warmupMs: z.number().int().min(0).max(600000),
      })
      .strict(),
    executionConfigDefaults: Object.freeze({ holdMs: 30000, warmupMs: 45000 }),
  },
  temperature_sensor: {
    label: 'Sensor de temperatura',
    controllable: false,
    stateSchema: z.object({ temperature: z.number().finite() }).strict(),
  },
});

const TYPE_NAMES = Object.keys(DEVICE_TYPES);
const isControllable = (type) => DEVICE_TYPES[type]?.controllable ?? false;

/** Valida e normaliza o estado de um tipo. `partial` serve para condições de gatilho. */
function parseState(type, value, { partial = false } = {}) {
  const base = DEVICE_TYPES[type].stateSchema;
  const schema = partial
    ? base.partial().refine((o) => Object.keys(o).length > 0, 'Informe ao menos um campo')
    : base;
  const result = schema.safeParse(value);
  if (!result.success) {
    throw AppError.badRequest(
      `Estado inválido para aparelho do tipo ${type}`,
      'INVALID_DEVICE_STATE',
      result.error.issues.map((i) => ({
        path: i.path.join('.'),
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

function parseExecutionConfig(type, value) {
  const config = DEVICE_TYPES[type]?.executionConfigSchema;
  if (!config) {
    throw AppError.badRequest(
      `O aparelho do tipo ${type} não possui configurações de execução`,
      'DEVICE_EXECUTION_CONFIG_UNSUPPORTED',
    );
  }
  const result = config.safeParse(value);
  if (!result.success) {
    throw AppError.badRequest(
      `Configuração de execução inválida para aparelho do tipo ${type}`,
      'INVALID_DEVICE_EXECUTION_CONFIG',
      result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    );
  }
  return result.data;
}

function getExecutionConfig(type, storedJson) {
  const defaults = DEVICE_TYPES[type]?.executionConfigDefaults;
  if (!defaults) return null;
  const stored = storedJson && typeof storedJson === 'object' ? storedJson : null;
  if (!stored) return { ...defaults };
  const result = DEVICE_TYPES[type].executionConfigSchema.safeParse(stored);
  return result.success ? result.data : { ...defaults };
}

module.exports = {
  DEVICE_TYPES,
  TYPE_NAMES,
  isControllable,
  parseState,
  safeParseState,
  parseExecutionConfig,
  getExecutionConfig,
};
