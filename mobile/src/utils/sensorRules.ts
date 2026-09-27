import { SensorControlType, SensorDirection, SensorType } from "../types";

export interface SensorRule {
  direction: SensorDirection;
  control: SensorControlType;
  usesPwmPin: boolean;
}

export const sensorRules: Record<SensorType, SensorRule> = {
  RELE: { direction: "OUTPUT", control: "DIGITAL", usesPwmPin: false },
  SERVO: { direction: "OUTPUT", control: "ANALOGICO", usesPwmPin: false },
  PWM: { direction: "OUTPUT", control: "ANALOGICO", usesPwmPin: true },
  REED_SWITCH: { direction: "INPUT", control: "DIGITAL", usesPwmPin: false },
};

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
