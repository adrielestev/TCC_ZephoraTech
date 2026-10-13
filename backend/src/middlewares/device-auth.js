import { macAddressSchema } from "../schemas/common.schemas.js";
import * as roomsService from "../services/rooms.service.js";
import { verifyAccessToken } from "../services/token.service.js";
import { ApiError } from "../utils/errors.js";

export async function authenticateDevice(req, _res, next) {
  try {
    const parsedMac = macAddressSchema.safeParse(req.get("x-device-mac"));
    const credential = req.get("x-device-credential") ?? "";

    if (!parsedMac.success || !/^[a-f0-9]{64}$/i.test(credential)) {
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

export async function authenticateDeviceToken(req, _res, next) {
  try {
    const roomId = Number(req.params.id ?? req.params.roomId);
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new ApiError(401, "Token do dispositivo nao informado.");
    }

    const payload = verifyAccessToken(token);
    req.deviceRoom = await roomsService.authenticateDeviceToken(roomId, payload);
    return next();
  } catch (error) {
    return next(
      error.statusCode ? error : new ApiError(401, "Token do dispositivo invalido."),
    );
  }
}