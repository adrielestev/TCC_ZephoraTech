import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      userLevel: user.user_level,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN },
  );
}

export function verifyAccessToken(token) {
  const payload = jwt.verify(token, env.JWT_SECRET);
  if (payload.role === "DEVICE") {
    throw new Error("Token de dispositivo nao pode autenticar usuario.");
  }
  return payload;
}

export function signDeviceToken(room) {
  if (!room.device_credential_hash) {
    throw new Error("Sala sem credencial de dispositivo.");
  }

  return jwt.sign(
    {
      sub: String(room.id),
      role: "DEVICE",
      mac: room.mac_address,
      cv: room.device_credential_hash,
    },
    env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

export function verifyDeviceToken(token) {
  const payload = jwt.verify(token, env.JWT_SECRET);
  if (payload.role !== "DEVICE") {
    throw new Error("Token não é de dispositivo.");
  }
  return payload;
}

