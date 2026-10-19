import {
  SensorControlType,
  SensorDeviceSettings,
  SensorDirection,
  SensorStateLabels,
  SensorType,
} from "../types";

export interface SensorRule {
  direction: SensorDirection;
  control: SensorControlType;
}

export const sensorRules: Record<SensorType, SensorRule> = {
  RELE: {
    direction: "OUTPUT",
    control: "DIGITAL",
  },
  SERVO: {
    direction: "OUTPUT",
    control: "ANALOGICO",
  },
  PWM: {
    direction: "OUTPUT",
    control: "ANALOGICO",
  },
  REED_SWITCH: {
    direction: "INPUT",
    control: "DIGITAL",
  },
  CONTACT_SENSOR: {
    direction: "INPUT",
    control: "DIGITAL",
  },
  PIR_SENSOR: {
    direction: "INPUT",
    control: "DIGITAL",
  },
  TEMPERATURE: {
    direction: "INPUT",
    control: "ANALOGICO",
  },
};

export const sensorTypeOptions: SensorType[] = [
  "RELE",
  "PWM",
  "SERVO",
  "CONTACT_SENSOR",
  "PIR_SENSOR",
  "REED_SWITCH",
  "TEMPERATURE",
];

export const sensorTypeLabels: Record<SensorType, string> = {
  RELE: "Relé",
  SERVO: "Servo",
  PWM: "PWM",
  REED_SWITCH: "Chave magnética",
  CONTACT_SENSOR: "Sensor de contato",
  PIR_SENSOR: "Sensor de presença",
  TEMPERATURE: "Temperatura",
};

export const sensorTypeIcons: Record<SensorType, string> = {
  RELE: "flash-outline",
  SERVO: "options-outline",
  PWM: "speedometer-outline",
  REED_SWITCH: "git-branch-outline",
  CONTACT_SENSOR: "home-outline",
  PIR_SENSOR: "walk-outline",
  TEMPERATURE: "thermometer-outline",
};

export const sensorTypeDisplayNames: Record<SensorType, string> = {
  ...sensorTypeLabels,
  REED_SWITCH: "Sensor magnético",
  CONTACT_SENSOR: "Sensor de contato",
  PIR_SENSOR: "Sensor de presença",
  TEMPERATURE: "Sensor de temperatura",
};

export const defaultDeviceSettings: Record<SensorType, SensorDeviceSettings> = {
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

export function getDefaultDeviceSettings(type: SensorType) {
  return { ...defaultDeviceSettings[type] };
}

export const defaultDeviceStateLabels: Record<SensorType, SensorStateLabels> = {
  RELE: { active: "Ligado", inactive: "Desligado" },
  SERVO: { active: "Em movimento", inactive: "Parado" },
  PWM: { active: "Em funcionamento", inactive: "Desligado" },
  REED_SWITCH: { active: "Fechado", inactive: "Aberto" },
  CONTACT_SENSOR: { active: "Fechado", inactive: "Aberto" },
  PIR_SENSOR: { active: "Presença detectada", inactive: "Sem presença" },
  TEMPERATURE: { active: "Temperatura atual", inactive: "Sem leitura" },
};

export function getDefaultDeviceStateLabels(type: SensorType) {
  return { ...defaultDeviceStateLabels[type] };
}

export function getSensorRule(type: SensorType) {
  return sensorRules[type];
}

export function isValidSensorConfiguration(
  type: SensorType,
  direction: SensorDirection,
  control: SensorControlType,
) {
  const rule = getSensorRule(type);
  return rule.direction === direction && rule.control === control;
}
