import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";
import * as rooms from "../repositories/rooms.repository.js";
import * as devices from "../repositories/devices.repository.js";
import { assertValidState } from "../utils/device-state.js";
import { evaluateInput } from "./automations.service.js";

export async function handshake(mac, credential) {
  if (!mac || !credential) throw new HttpError(401, "Credenciais do dispositivo necessárias");
  const room = await rooms.findRoomByMac(mac.toUpperCase());
  const receivedHash = crypto.createHash("sha256").update(credential).digest("hex");
  if (!room?.device_credential_hash || room.device_credential_hash.length !== receivedHash.length
    || !crypto.timingSafeEqual(Buffer.from(room.device_credential_hash), Buffer.from(receivedHash))) {
    throw new HttpError(401, "Credenciais do dispositivo inválidas");
  }
  await rooms.touchRoom(room.id);
  const token = jwt.sign({ kind: "device", room_id: room.id, mac_address: room.mac_address, credential_hash: receivedHash }, env.JWT_SECRET, { expiresIn: env.DEVICE_JWT_EXPIRES_IN });
  return { token, room_id: room.id, devices: await devices.listForDevice(room.id) };
}

export async function getCommands(roomId) {
  await rooms.touchRoom(roomId);
  return devices.listForDevice(roomId);
}

export async function reportState(roomId, deviceId, value) {
  const device = await devices.findById(deviceId);
  if (!device || device.room_id !== roomId) throw new HttpError(404, "Dispositivo não encontrado nesta sala");
  assertValidState(device, value);
  await devices.reportState(device, value);
  await evaluateInput(device, value);
  await rooms.touchRoom(roomId);
  return devices.findById(device.id);
}
