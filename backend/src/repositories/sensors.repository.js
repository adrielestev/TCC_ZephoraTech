import { db } from "../db/connection.js";

export function listSensorsForUser(user) {
  const query = db("sensors")
    .join("rooms", "rooms.id", "sensors.room_id")
    .select("sensors.*", "rooms.name as room_name", "rooms.classroom_code")
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

  return query;
}

export function findSensorById(id) {
  return db("sensors").where({ id }).first();
}

export function findSensorByRoomAndDeviceKey(roomId, deviceKey) {
  return db("sensors")
    .where({ room_id: roomId, device_key: deviceKey })
    .first();
}

export function listSensorsByRoom(roomId) {
  return db("sensors").where({ room_id: roomId }).orderBy("name");
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
      "pin_pwm",
      "current_state",
    )
    .where({ room_id: roomId, direction: "OUTPUT" })
    .orderBy("device_key");
}

export async function createSensor(payload) {
  const [id] = await db("sensors").insert(payload);
  return findSensorById(id);
}

export async function updateSensor(id, payload) {
  const updated = await db("sensors").where({ id }).update(payload);
  return updated ? findSensorById(id) : null;
}

export function deleteSensor(id) {
  return db("sensors").where({ id }).delete();
}
