import { HttpError } from "../utils/http-error.js";
import * as rooms from "../repositories/rooms.repository.js";
import * as devices from "../repositories/devices.repository.js";
import * as automations from "../repositories/automations.repository.js";
import { db } from "../db.js";
import {
  assertCompatibleType,
  assertValidState,
} from "../utils/device-state.js";

export async function get(id) {
  const device = await devices.findById(id);
  if (!device) throw new HttpError(404, "Dispositivo não encontrado");
  const control = device.direction === "output"
    ? await automations.findActiveForTarget(id)
    : null;
  return {
    ...device,
    automation_lock: control ? { id: control.id, name: control.name } : null,
  };
}

export async function listForRoom(id) {
  const [roomDevices, locks] = await Promise.all([
    devices.listForRoom(id),
    automations.findActiveLocksForRoom(id),
  ]);
  const locksByTarget = new Map(
    locks.map((lock) => [lock.target_sensor_id, { id: lock.id, name: lock.name }]),
  );
  return roomDevices.map((device) => ({
    ...device,
    automation_lock: locksByTarget.get(device.id) ?? null,
  }));
}

export async function create(roomId, input) {
  if (!(await rooms.findRoomById(roomId)))
    throw new HttpError(404, "Sala não encontrada");
  assertCompatibleType(input.direction, input.type);
  const row = {
    room_id: roomId,
    ...input,
    config_json: input.config_json ? JSON.stringify(input.config_json) : null,
    state_labels_json: input.state_labels_json
      ? JSON.stringify(input.state_labels_json)
      : null,
    desired_state:
      input.direction === "output" ? (input.current_state ?? 0) : null,
  };
  const [id] = await devices.create(row);
  return get(id);
}

export async function update(id, input) {
  const old = await get(id);
  if (input.direction && input.direction !== old.direction)
    throw new HttpError(
      400,
      "Direção não pode ser alterada; remova e recrie o dispositivo",
    );
  assertCompatibleType(old.direction, input.type || old.type);
  const { current_state: _ignored, ...configuration } = input;
  await devices.update(id, {
    ...configuration,
    ...(configuration.config_json && {
      config_json: JSON.stringify(configuration.config_json),
    }),
    ...(configuration.state_labels_json && {
      state_labels_json: JSON.stringify(configuration.state_labels_json),
    }),
    updated_at: new Date().toISOString(),
  });
  return get(id);
}

export async function remove(id) {
  const result = await db.transaction(async (transaction) => {
    const rules = await automations.findUsingDevice(id, transaction);
    if (rules.length) return { rules };
    return { deleted: await devices.remove(id, transaction) };
  });

  if (result.rules) {
    const names = result.rules.map((rule) => `“${rule.name}”`).join(", ");
    throw new HttpError(
      409,
      `Não é possível excluir este dispositivo enquanto estiver vinculado a automação(ões): ${names}. Edite ou exclua essas regras primeiro.`,
    );
  }
  if (!result.deleted) throw new HttpError(404, "Dispositivo não encontrado");
}

export async function command(user, id, value, requireRoomAccess) {
  const device = await get(id);
  await requireRoomAccess(user, device.room_id);
  if (device.direction !== "output")
    throw new HttpError(400, "Só é possível comandar dispositivos de saída");
  assertValidState(device, value);
  await db.transaction(async (transaction) => {
    const control = await automations.findActiveForTarget(id, transaction);
    if (control) {
      throw new HttpError(
        423,
        `“${device.name}” está sendo controlado pela automação “${control.name}”. Aguarde a condição terminar ou pause/exclua a automação para comandá-lo manualmente.`,
      );
    }
    await devices.setDesiredState(id, value, transaction);
  });
  return get(id);
}
