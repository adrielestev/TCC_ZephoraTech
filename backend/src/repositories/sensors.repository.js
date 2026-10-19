import { db } from "../db/connection.js";
import {
  DEFAULT_DEVICE_SETTINGS,
  DEFAULT_DEVICE_STATE_LABELS,
} from "../config/constants.js";

function parseSettings(sensor) {
  if (!sensor) return sensor;
  for (const field of ["device_settings", "state_labels"]) {
    if (typeof sensor[field] === "string") {
      try {
        sensor[field] = JSON.parse(sensor[field]);
      } catch {
        sensor[field] = {};
      }
    }
  }
  sensor.device_settings = {
    ...DEFAULT_DEVICE_SETTINGS[sensor.type],
    ...(sensor.device_settings ?? {}),
  };
  sensor.state_labels = {
    ...DEFAULT_DEVICE_STATE_LABELS[sensor.type],
    ...(sensor.state_labels ?? {}),
  };
  // Before the single-pin model, PWM devices stored the actual PWM output in
  // pin_pwm. Prefer that value when reading legacy rows, then hide the field.
  if (sensor.type === "PWM" && sensor.pin_pwm != null) {
    sensor.pin = sensor.pin_pwm;
  }
  delete sensor.pin_pwm;
  return sensor;
}

function serializeSettings(payload) {
  const serialized = { ...payload };
  for (const field of ["device_settings", "state_labels"]) {
    if (Object.hasOwn(payload, field)) {
      serialized[field] = JSON.stringify(payload[field] ?? {});
    }
  }
  return serialized;
}

export function listSensorsForUser(user) {
  const sensorColumns =
    user.user_level === "ADMIN"
      ? ["sensors.*"]
      : [
          "sensors.id",
          "sensors.room_id",
          "sensors.name",
          "sensors.direction",
          "sensors.type",
          "sensors.type_of_control",
          "sensors.device_settings",
          "sensors.state_labels",
          "sensors.current_state",
          "sensors.created_at",
          "sensors.updated_at",
        ];
  const query = db("sensors")
    .join("rooms", "rooms.id", "sensors.room_id")
    .select(...sensorColumns, "rooms.name as room_name", "rooms.classroom_code")
    .orderBy("rooms.name")
    .orderBy("sensors.name");

  if (user.user_level !== "ADMIN") {
    query
      .join(
        "room_collaborators",
        "room_collaborators.room_id",
        "sensors.room_id",
      )
      .where("room_collaborators.user_id", user.id);
  }

  return query.then((sensors) => sensors.map(parseSettings));
}

export function findSensorById(id) {
  return db("sensors").where({ id }).first().then(parseSettings);
}

export function findSensorByRoomAndDeviceKey(roomId, deviceKey) {
  return db("sensors")
    .where({ room_id: roomId, device_key: deviceKey })
    .first()
    .then(parseSettings);
}

export function listSensorsByRoom(roomId) {
  return db("sensors")
    .where({ room_id: roomId })
    .orderBy("name")
    .then((sensors) => sensors.map(parseSettings));
}

export function listRoomOutputCommands(roomId) {
  return db("sensors")
    .select(
      "id",
      "device_key",
      "direction",
      "type",
      "type_of_control",
      "pin",
      "device_settings",
      "current_state",
    )
    .where({ room_id: roomId, direction: "OUTPUT" })
    .orderBy("device_key")
    .then((commands) => commands.map(parseSettings));
}

export function listRoomDeviceConfiguration(roomId) {
  return db("sensors")
    .select(
      "id",
      "device_key",
      "direction",
      "type",
      "type_of_control",
      "pin",
      "device_settings",
    )
    .where({ room_id: roomId })
    .orderBy("device_key")
    .then((devices) => devices.map(parseSettings));
}

export function toPublicSensor(sensor) {
  const { device_key: _deviceKey, pin: _pin, ...publicSensor } = sensor;
  return publicSensor;
}

export async function createSensor(payload) {
  const [id] = await db("sensors").insert(serializeSettings(payload));
  return findSensorById(id);
}

export async function updateSensor(id, payload) {
  const updated = await db("sensors")
    .where({ id })
    .update(serializeSettings(payload));
  return updated ? findSensorById(id) : null;
}

export function deleteSensor(id) {
  return db("sensors").where({ id }).delete();
}
