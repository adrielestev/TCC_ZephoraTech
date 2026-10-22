import jwt from "jsonwebtoken";
import { db } from "../db.js";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";
import { asyncHandler } from "../utils/async-handler.js";

export const authenticateUser = asyncHandler(async (req, _res, next) => {
  const token = req.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new HttpError(401, "Autenticação necessária");
  let payload;
  try { payload = jwt.verify(token, env.JWT_SECRET); }
  catch { throw new HttpError(401, "Token inválido ou expirado"); }
  if (payload.kind || !Number.isInteger(payload.id)) throw new HttpError(401, "Token de usuário necessário");
  const user = await db("users").where({ id: payload.id }).whereNull("deleted_at").first();
  if (!user || !user.is_email_verified) throw new HttpError(401, "Conta indisponível");
  req.user = { id: user.id, user_level: user.user_level };
  next();
});

export function requireAdmin(req, _res, next) {
  if (req.user?.user_level !== "admin") return next(new HttpError(403, "Ação exclusiva de administrador"));
  next();
}

export const authenticateDevice = asyncHandler(async (req, _res, next) => {
  const token = req.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new HttpError(401, "Token ESP32 necessário");
  let payload;
  try { payload = jwt.verify(token, env.JWT_SECRET); }
  catch { throw new HttpError(401, "Token ESP32 inválido ou expirado"); }
  if (payload.kind !== "device" || !Number.isInteger(payload.room_id) || typeof payload.credential_hash !== "string") {
    throw new HttpError(401, "Token ESP32 necessário");
  }
  const room = await db("rooms").where({ id: payload.room_id, device_credential_hash: payload.credential_hash }).first();
  if (!room || room.mac_address !== payload.mac_address) throw new HttpError(401, "Credencial ESP32 revogada");
  req.deviceRoom = room;
  next();
});
