import * as sensorsService from "../services/sensors.service.js";

export async function listSensors(req, res) {
  const sensors = await sensorsService.listSensors(req.user);
  res.json({ sensors });
}

export async function createSensor(req, res) {
  const sensor = await sensorsService.createSensor(req.body);
  res.status(201).json({ sensor });
}

export async function getSensor(req, res) {
  const sensor = await sensorsService.getSensor(req.user, req.params.id);
  res.json({ sensor });
}

export async function updateSensor(req, res) {
  const sensor = await sensorsService.updateSensor(req.params.id, req.body);
  res.json({ sensor });
}

export async function deleteSensor(req, res) {
  await sensorsService.deleteSensor(req.params.id);
  res.status(204).send();
}

export async function commandSensor(req, res) {
  const sensor = await sensorsService.commandSensor(req.user, req.params.id, req.body.current_state);
  res.json({ sensor });
}

export async function reportSensorState(req, res) {
  const sensor = await sensorsService.reportSensorState(
    req.params.roomId,
    req.params.deviceKey,
    req.body.mac_address,
    req.body.current_state
  );

  res.json({ sensor });
}
