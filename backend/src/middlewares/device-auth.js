import { macAddressSchema } from "../schemas/common.schemas.js";
import * as roomsService from "../services/rooms.service.js";
import { verifyDeviceToken } from "../services/token.service.js";
import { ApiError } from "../utils/errors.js";

export async function authenticateDevice(req, _res, next) {
  try {
    const parsedMac = macAddressSchema.safeParse(req.get("x-device-mac"));
    const credential = req.get("x-device-credential") ?? "";
    const hasCredentialHeaders =
      parsedMac.success && /^[a-f0-9]{64}$/i.test(credential);

    const authHeader = req.get("authorization") || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme === "Bearer" && token) {
      try {
        const payload = verifyDeviceToken(token);
        req.deviceRoom = await roomsService.authenticateDeviceSession(payload);
        return next();
      } catch {
        if (!hasCredentialHeaders) {
          throw new ApiError(401, "Token de dispositivo invalido ou expirado.");
        }
      }
    }

    if (!hasCredentialHeaders) {
      throw new ApiError(401, "Credenciais do dispositivo invalidas.");
    }

    req.deviceRoom = await roomsService.authenticateDevice(
      parsedMac.data,
      credential,
    );
    return next();
  } catch (error) {
    return next(error);
  }
}