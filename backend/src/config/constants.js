export const SALT_ROUNDS = 12;

export const SIGNED_URL_LIFETIME_SECONDS = 60 * 60;

export const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const SENSOR_RULES = {
  RELE: { direction: "OUTPUT", control: "DIGITAL", usesPwmPin: false },
  SERVO: { direction: "OUTPUT", control: "ANALOGICO", usesPwmPin: false },
  PWM: { direction: "OUTPUT", control: "ANALOGICO", usesPwmPin: true },
  REED_SWITCH: { direction: "INPUT", control: "DIGITAL", usesPwmPin: false },
};
