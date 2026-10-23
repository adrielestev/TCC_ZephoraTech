import { HttpError } from "./http-error.js";
import { findDeviceDriver, isSupportedDevice } from "../domain/device-drivers.js";

export function assertValidState(device, value) {
  const driver = findDeviceDriver(device.type, device.direction);
  if (!driver) throw new HttpError(400, "Este dispositivo ainda não possui um driver implementado");
  const { min, max, integer } = driver.state;
  if (value < min || value > max || (integer && !Number.isInteger(value))) {
    throw new HttpError(400, `Este dispositivo aceita valores entre ${min} e ${max}${integer ? " inteiros" : ""}`);
  }
}

export function assertCompatibleType(direction, type) {
  if (!isSupportedDevice(type, direction)) {
    throw new HttpError(
      400,
      "Driver ainda não disponível. Atualmente são aceitos relay/output e presence/input.",
    );
  }
}
