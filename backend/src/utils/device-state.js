import { HttpError } from "./http-error.js";

export function assertValidState(device, value) {
  if (device.type === "temperature") {
    if (device.direction !== "input" || value < -40 || value > 125) throw new HttpError(400, "Temperatura deve estar entre -40 e 125 °C e ser uma entrada");
    return;
  }
  if (["relay", "presence", "contact"].includes(device.type)) {
    if (![0, 1].includes(value)) throw new HttpError(400, "Este dispositivo aceita somente 0 ou 1");
    return;
  }
  if (value < 0 || value > 100) throw new HttpError(400, "Valor deve estar entre 0 e 100");
}

export function assertCompatibleType(direction, type) {
  if (direction === "output" && !["relay", "pwm"].includes(type)) throw new HttpError(400, "Saídas devem ser relay ou pwm");
  if (direction === "input" && ["relay", "pwm"].includes(type)) throw new HttpError(400, "relay e pwm devem ser output");
}
