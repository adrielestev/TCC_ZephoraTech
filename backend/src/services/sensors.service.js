import * as collaboratorsRepository from "../repositories/collaborators.repository.js";
import * as roomsRepository from "../repositories/rooms.repository.js";
import * as sensorsRepository from "../repositories/sensors.repository.js";
import { nowIso } from "../utils/datetime.js";
import { ApiError, notFound } from "../utils/errors.js";
import { assertRoomExists } from "./rooms.service.js";
import { sensorSchema } from "../schemas/sensors.schemas.js";
import {
  DEFAULT_DEVICE_SETTINGS,
  DEFAULT_DEVICE_STATE_LABELS,
  isValidSensorState,
  SENSOR_RULES,
} from "../config/constants.js";

export function listSensors(user) {
  return sensorsRepository.listSensorsForUser(user);
}

export async function createSensor(payload) {
  await assertRoomExists(payload.room_id);

  return sensorsRepository.createSensor({
    ...payload,
    device_settings:
      payload.device_settings ?? DEFAULT_DEVICE_SETTINGS[payload.type],
    state_labels:
      payload.state_labels ?? DEFAULT_DEVICE_STATE_LABELS[payload.type],
    current_state: payload.current_state ?? 0,
  });
}

export async function getSensor(user, sensorId) {
  const sensor = await findSensorOrFail(sensorId);
  await assertCanReadSensor(user, sensor);
  return user.user_level === "ADMIN"
    ? sensor
    : sensorsRepository.toPublicSensor(sensor);
}

export async function updateSensor(sensorId, payload) {
  const currentSensor = await sensorsRepository.findSensorById(sensorId);
  if (!currentSensor) {
    throw notFound("Sensor");
  }

  const nextType = payload.type ?? currentSensor.type;
  const mergedSettings = payload.device_settings
    ? { ...(currentSensor.device_settings ?? {}), ...payload.device_settings }
    : payload.type && payload.type !== currentSensor.type
      ? DEFAULT_DEVICE_SETTINGS[nextType]
      : currentSensor.device_settings;
  const mergedLabels = payload.state_labels
    ? { ...(currentSensor.state_labels ?? {}), ...payload.state_labels }
    : payload.type && payload.type !== currentSensor.type
      ? DEFAULT_DEVICE_STATE_LABELS[nextType]
      : currentSensor.state_labels;
  const validation = sensorSchema.safeParse({
    ...currentSensor,
    ...payload,
    device_settings: mergedSettings,
    state_labels: mergedLabels,
  });
  if (!validation.success) {
    throw new ApiError(
      400,
      "Tipo, direção, controle e pinos do sensor são incompatíveis.",
    );
  }

  const clearLegacyPwmPin =
    payload.pin !== undefined || payload.type !== undefined;
  const sensor = await sensorsRepository.updateSensor(sensorId, {
    ...payload,
    ...(clearLegacyPwmPin ? { pin_pwm: null } : {}),
    ...(mergedSettings ? { device_settings: mergedSettings } : {}),
    ...(mergedLabels ? { state_labels: mergedLabels } : {}),
  });

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

  assertValidState(sensor, currentState);

  const updatedSensor = await sensorsRepository.updateSensor(sensor.id, {
    current_state: currentState,
  });
  return user.user_level === "ADMIN"
    ? updatedSensor
    : sensorsRepository.toPublicSensor(updatedSensor);
}

export async function reportSensorState(room, deviceKey, currentState) {
  const sensor = await sensorsRepository.findSensorByRoomAndDeviceKey(
    room.id,
    deviceKey,
  );
  if (!sensor) {
    throw notFound("Sensor");
  }

  assertValidState(sensor, currentState);

  const updatedSensor = await sensorsRepository.updateSensor(sensor.id, {
    current_state: currentState,
  });
  await roomsRepository.touchRoomLastSeen(room.id, nowIso());

  return {
    id: updatedSensor.id,
    room_id: updatedSensor.room_id,
    direction: updatedSensor.direction,
    current_state: updatedSensor.current_state,
  };
}

function assertValidState(sensor, state) {
  if (isValidSensorState(sensor.type, state, sensor.device_settings ?? {}))
    return;

  const rule = SENSOR_RULES[sensor.type];
  const message =
    rule?.stateEncoding === "BINARY"
      ? "Dispositivos digitais aceitam somente 0 (desligado/inativo) ou 1 (ligado/ativo)."
      : "Valor fora da faixa configurada para este dispositivo.";
  throw new ApiError(400, message);
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

  const collaborator = await collaboratorsRepository.findRoomCollaborator(
    sensor.room_id,
    user.id,
  );

  if (!collaborator) {
    throw new ApiError(403, "Voce nao tem acesso a este sensor.");
  }
}

async function assertCanOperateRoom(user, roomId) {
  if (user.user_level === "ADMIN") return;

  const collaborator = await collaboratorsRepository.findRoomCollaborator(
    roomId,
    user.id,
  );

  if (!collaborator) {
    throw new ApiError(403, "Voce nao tem permissao para operar esta sala.");
  }
}
