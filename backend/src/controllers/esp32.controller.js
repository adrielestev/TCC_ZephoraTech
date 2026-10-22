import * as esp32 from "../services/esp32.service.js";
import { deviceView } from "../serializers/device.serializer.js";

export async function handshake(req, res) {
  const result = await esp32.handshake(req.get("x-device-mac"), req.get("x-device-credential"));
  res.json({ ...result, devices: result.devices.map(deviceView) });
}
export async function commands(req, res) {
  res.json({ devices: (await esp32.getCommands(req.deviceRoom.id)).map(deviceView) });
}
export async function reportState(req, res) {
  res.json({ device: deviceView(await esp32.reportState(req.deviceRoom.id, req.params.id, req.body.value)) });
}
