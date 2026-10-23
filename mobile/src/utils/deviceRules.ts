import { DeviceDirection, DeviceType } from "../types";

export const deviceTypesByDirection: Record<DeviceDirection, DeviceType[]> = {
  // Tipos com driver implementado. Novos ficam disponíveis depois de
  // registrados no backend e no registry de drivers do ESP32.
  output: ["relay"],
  input: ["presence"],
};

export function hasImplementedDeviceDriver(direction: DeviceDirection, type: DeviceType) {
  return deviceTypesByDirection[direction].includes(type);
}

export const deviceTypeLabels: Record<DeviceType, string> = {
  relay: "Relé",
  pwm: "PWM",
  temperature: "Temperatura",
  presence: "Presença",
  contact: "Contato magnético",
};

export const deviceTypeIcons: Record<DeviceType, string> = {
  relay: "toggle-outline",
  pwm: "sunny-outline",
  temperature: "thermometer-outline",
  presence: "walk-outline",
  contact: "radio-button-on-outline",
};

export const defaultDeviceLabels: Record<DeviceType, { active: string; inactive: string }> = {
  relay: { active: "Ligado", inactive: "Desligado" },
  pwm: { active: "Ligado", inactive: "Desligado" },
  temperature: { active: "Ativo", inactive: "Inativo" },
  presence: { active: "Presença detectada", inactive: "Sem presença" },
  contact: { active: "Aberto", inactive: "Fechado" },
};

export function deviceDirectionLabel(direction: DeviceDirection) {
  return direction === "output" ? "Saída controlável" : "Entrada de leitura";
}

export function deviceStateLabel(
  type: DeviceType,
  value: number,
  labels?: Record<string, string>,
  unit = "°C",
) {
  if (type === "temperature") return `${value.toFixed(1).replace(".", ",")} ${unit}`;
  const stateKey = value > 0 ? "active" : "inactive";
  return labels?.[stateKey] || defaultDeviceLabels[type][stateKey];
}
