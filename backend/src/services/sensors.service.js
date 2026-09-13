import * as collaboratorsRepository from "../repositories/collaborators.repository.js";
import * as roomsRepository from "../repositories/rooms.repository.js";
import * as sensorsRepository from "../repositories/sensors.repository.js";
import { nowIso } from "../utils/datetime.js";
import { ApiError, notFound } from "../utils/errors.js";
import { assertRoomExists } from "./rooms.service.js";

export function listSensors(user) {
  return sensorsRepository.listSensorsForUser(user);
}

export async function createSensor(payload) {
  await assertRoomExists(payload.room_id);

  return sensorsRepository.createSensor({
    ...payload,
    pin_pwm: payload.pin_pwm ?? null,
    current_state: payload.current_state ?? 0
  });
}

export async function getSensor(user, sensorId) {
  const sensor = await findSensorOrFail(sensorId);
  await assertCanReadSensor(user, sensor);
  return sensor;
}

export async function updateSensor(sensorId, payload) {
  const sensor = await sensorsRepository.updateSensor(sensorId, payload);

  if (!sensor) {
    throw notFound("Sensor");
  }

  return sensor;
}

export async function deleteSensor(sensorId) {
  const deleted = await sensorsRepository.deleteSensor(sensorId);

  if (!deleted) {
    throw notFound("Sensor");
  }
}

export async function commandSensor(user, sensorId, currentState) {
  const sensor = await findSensorOrFail(sensorId);
  await assertCanOperateRoom(user, sensor.room_id);

  if (sensor.direction !== "OUTPUT") {
    throw new ApiError(400, "Apenas sensores OUTPUT recebem comandos.");
  }

  return sensorsRepository.updateSensor(sensor.id, { current_state: currentState });
}

export async function reportSensorState(roomId, deviceKey, macAddress, currentState) {
  const room = await roomsRepository.findRoomByIdAndMac(roomId, macAddress);
  if (!room) {
    throw new ApiError(403, "Sala ou MAC address invalido.");
  }

  const sensor = await sensorsRepository.findSensorByRoomAndDeviceKey(room.id, deviceKey);
  if (!sensor) {
    throw notFound("Sensor");
  }

  const updatedSensor = await sensorsRepository.updateSensor(sensor.id, {
    current_state: currentState
  });
  await roomsRepository.touchRoomLastSeen(room.id, nowIso());

  return updatedSensor;
}

async function findSensorOrFail(sensorId) {
  const sensor = await sensorsRepository.findSensorById(sensorId);

  if (!sensor) {
    throw notFound("Sensor");
  }

  return sensor;
}

async function assertCanReadSensor(user, sensor) {
  if (user.user_level === "ADMIN") return;

  const collaborator = await collaboratorsRepository.findRoomCollaborator(sensor.room_id, user.id);

  if (!collaborator) {
    throw new ApiError(403, "Voce nao tem acesso a este sensor.");
  }
}

async function assertCanOperateRoom(user, roomId) {
  if (user.user_level === "ADMIN") return;

  const collaborator = await collaboratorsRepository.findRoomCollaborator(roomId, user.id);

  if (!collaborator) {
    throw new ApiError(403, "Voce nao tem permissao para operar esta sala.");
  }
}
