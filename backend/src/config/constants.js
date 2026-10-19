export const SALT_ROUNDS = 12;

export const SIGNED_URL_LIFETIME_SECONDS = 60 * 60;

export const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const SENSOR_RULES = {
  RELE: {
    direction: "OUTPUT",
    control: "DIGITAL",
    stateEncoding: "BINARY",
  },
  SERVO: {
    direction: "OUTPUT",
    control: "ANALOGICO",
    stateEncoding: "PERCENT",
  },
  PWM: {
    direction: "OUTPUT",
    control: "ANALOGICO",
    stateEncoding: "PERCENT",
  },
  REED_SWITCH: {
    direction: "INPUT",
    control: "DIGITAL",
    stateEncoding: "BINARY",
  },
  CONTACT_SENSOR: {
    direction: "INPUT",
    control: "DIGITAL",
    stateEncoding: "BINARY",
  },
  PIR_SENSOR: {
    direction: "INPUT",
    control: "DIGITAL",
    stateEncoding: "BINARY",
  },
  TEMPERATURE: {
    direction: "INPUT",
    control: "ANALOGICO",
    stateEncoding: "CELSIUS",
  },
};

export const DEFAULT_DEVICE_SETTINGS = {
  RELE: { inverted: false },
  SERVO: {
    min_percent: 0,
    max_percent: 100,
    step_percent: 5,
    min_angle: 0,
    max_angle: 180,
  },
  PWM: {
    min_percent: 0,
    max_percent: 100,
    step_percent: 5,
    frequency_hz: 5000,
    inverted: false,
  },
  REED_SWITCH: { inverted: false, debounce_ms: 50 },
  CONTACT_SENSOR: { inverted: false, debounce_ms: 50 },
  PIR_SENSOR: { inverted: false, debounce_ms: 50, hold_ms: 0 },
  TEMPERATURE: {},
};

export const DEFAULT_DEVICE_STATE_LABELS = {
  RELE: { active: "Ligado", inactive: "Desligado" },
  SERVO: { active: "Em movimento", inactive: "Parado" },
  PWM: { active: "Em funcionamento", inactive: "Desligado" },
  REED_SWITCH: { active: "Fechado", inactive: "Aberto" },
  CONTACT_SENSOR: { active: "Fechado", inactive: "Aberto" },
  PIR_SENSOR: { active: "Presença detectada", inactive: "Sem presença" },
  TEMPERATURE: { active: "Temperatura atual", inactive: "Sem leitura" },
};

export function isValidSensorState(type, state, settings = {}) {
  const rule = SENSOR_RULES[type];
  if (!rule || !Number.isFinite(state)) return false;
  if (rule.stateEncoding === "BINARY") return state === 0 || state === 1;
  if (rule.stateEncoding === "CELSIUS") return state >= -40 && state <= 125;
  const defaults = DEFAULT_DEVICE_SETTINGS[type];
  const minimum = settings.min_percent ?? defaults.min_percent ?? 0;
  const maximum = settings.max_percent ?? defaults.max_percent ?? 100;
  return state === 0 || (state >= minimum && state <= maximum);
}
