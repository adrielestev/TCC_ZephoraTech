/**
 * Drivers currently available to rooms. To add one, register its semantic
 * device type and direction here, then implement it in the ESP32 registry.
 */
export const DEVICE_DRIVER_REGISTRY = Object.freeze({
  relay_gpio: Object.freeze({
    type: "relay", direction: "output", state: Object.freeze({ min: 0, max: 1, integer: true }),
  }),
  pir_gpio: Object.freeze({
    type: "presence", direction: "input", state: Object.freeze({ min: 0, max: 1, integer: true }),
  }),
});

export const SUPPORTED_DEVICE_TYPES = Object.freeze(
  [...new Set(Object.values(DEVICE_DRIVER_REGISTRY).map(({ type }) => type))],
);

export function isSupportedDevice(type, direction) {
  return findDeviceDriver(type, direction) !== undefined;
}

export function findDeviceDriver(type, direction) {
  return Object.values(DEVICE_DRIVER_REGISTRY).find(
    (driver) => driver.type === type && driver.direction === direction,
  );
}
