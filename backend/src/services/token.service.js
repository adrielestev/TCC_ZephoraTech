import jwt from "jsonwebtoken";
import { createHmac } from "node:crypto";
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
  return jwt.verify(token, env.JWT_SECRET);
}

export function signDeviceAccessToken(room) {
  const token = jwt.sign(
    {
      sub: String(room.id),
      tokenType: "device",
      macAddress: room.mac_address,
      credentialVersion: getDeviceCredentialVersion(room.device_credential_hash),
    },
    env.JWT_SECRET,
    { expiresIn: env.DEVICE_JWT_EXPIRES_IN },
  );
  const { exp, iat } = jwt.decode(token);

  return { token, expiresIn: exp - iat };
}

export function getDeviceCredentialVersion(credentialHash) {
  return createHmac("sha256", env.JWT_SECRET)
    .update(`device-credential:${credentialHash}`)
    .digest("hex");
}
