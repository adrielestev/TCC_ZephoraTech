import { HttpError } from "../utils/http-error.js";
import * as rooms from "../repositories/rooms.repository.js";
import * as devices from "../repositories/devices.repository.js";
import * as automations from "../repositories/automations.repository.js";
import { assertValidState } from "../utils/device-state.js";
import { isSupportedDevice } from "../domain/device-drivers.js";
import { db } from "../db.js";

const lastTriggeredAt = new Map();
const comparisons = {
  eq: (a, b) => a === b, ne: (a, b) => a !== b,
  gt: (a, b) => a > b, gte: (a, b) => a >= b,
  lt: (a, b) => a < b, lte: (a, b) => a <= b,
};

export async function listForRoom(roomId) {
  if (!(await rooms.findRoomById(roomId))) throw new HttpError(404, "Sala não encontrada");
  return automations.findForRoom(roomId);
}

async function evaluateRuleNow(ruleId, sourceValue) {
  if (sourceValue == null) return;
  const rule = await automations.findById(ruleId);
  const source = rule ? await devices.findById(rule.source_sensor_id) : null;
  if (source) await evaluateInput(source, sourceValue, ruleId);
}

export async function create(roomId, input) {
  if (!(await rooms.findRoomById(roomId))) throw new HttpError(404, "Sala não encontrada");
  const [source, target] = await Promise.all([devices.findById(input.source_sensor_id), devices.findById(input.target_sensor_id)]);
  if (!source || !target || source.room_id !== roomId || target.room_id !== roomId) throw new HttpError(400, "Os dispositivos devem pertencer à sala informada");
  if (source.direction !== "input" || target.direction !== "output") throw new HttpError(400, "A automação precisa de uma entrada como origem e uma saída como destino");
  if (!isSupportedDevice(source.type, source.direction) || !isSupportedDevice(target.type, target.direction)) {
    throw new HttpError(400, "A automação só pode usar dispositivos com driver implementado.");
  }
  assertValidState(target, input.target_value);
  const [id] = await automations.create({
    ...input,
    is_enabled: input.is_enabled === false ? 0 : 1,
    restore_previous: input.restore_previous === true ? 1 : 0,
    is_active: 0,
    previous_target_value: null,
    cooldown_seconds: input.restore_previous ? 0 : input.cooldown_seconds || 0,
  });
  const created = await automations.findById(id);
  if (created.is_enabled) await evaluateRuleNow(id, source.current_state);
  return automations.findById(id);
}

export async function update(id, changes) {
  const old = await automations.findById(id);
  if (!old) throw new HttpError(404, "Automação não encontrada");
  if (old.is_active && changes.is_enabled !== false) {
    throw new HttpError(409, "Pause a automação antes de editá-la; enquanto ativa, ela controla a saída.");
  }
  const next = { ...old, ...changes };
  const [source, target] = await Promise.all([devices.findById(next.source_sensor_id), devices.findById(next.target_sensor_id)]);
  if (!source || !target || source.room_id !== target.room_id) throw new HttpError(400, "Os dispositivos devem pertencer à mesma sala");
  if (source.direction !== "input" || target.direction !== "output") throw new HttpError(400, "A automação precisa de uma entrada como origem e uma saída como destino");
  const devicesChanged = next.source_sensor_id !== old.source_sensor_id ||
      next.target_sensor_id !== old.target_sensor_id;
  if (devicesChanged &&
      (!isSupportedDevice(source.type, source.direction) || !isSupportedDevice(target.type, target.direction))) {
    throw new HttpError(400, "A automação só pode usar dispositivos com driver implementado.");
  }
  assertValidState(target, next.target_value);
  if (next.restore_previous && next.is_enabled && !old.restore_previous &&
      (await automations.findActiveForTarget(next.target_sensor_id))) {
    throw new HttpError(409, "A saída já está sob controle de outra automação ativa");
  }
  await db.transaction(async (transaction) => {
    const current = await automations.findById(id, transaction);
    if (!current) throw new HttpError(404, "Automação não encontrada");
    const pausing = changes.is_enabled === false;
    await automations.update(id, {
      ...changes,
      ...(changes.is_enabled !== undefined ? { is_enabled: Number(changes.is_enabled) } : {}),
      ...(changes.restore_previous !== undefined
        ? {
            restore_previous: Number(changes.restore_previous),
            ...(changes.restore_previous ? { cooldown_seconds: 0 } : {}),
          }
        : {}),
      ...(pausing ? { is_active: 0, previous_target_value: null } : {}),
      updated_at: new Date().toISOString(),
    }, transaction);
  });
  if (next.is_enabled) await evaluateRuleNow(id, source.current_state);
  return automations.findById(id);
}

export async function remove(id) {
  if (!(await automations.remove(id))) throw new HttpError(404, "Automação não encontrada");
  lastTriggeredAt.delete(id);
}

export async function evaluateInput(device, value, onlyRuleId) {
  if (device.direction !== "input") return;
  const rules = await automations.findEnabledForInput(device.id);
  const now = Date.now();
  for (const rule of rules) {
    if (onlyRuleId && rule.id !== onlyRuleId) continue;
    const matches = comparisons[rule.operator](value, rule.comparison_value);
    let activated = false;
    await db.transaction(async (transaction) => {
      const current = await automations.findById(rule.id, transaction);
      if (!current || !current.is_enabled) return;

      if (!matches) {
        if (!current.restore_previous || !current.is_active) return;
        const previousValue = current.previous_target_value;
        if (previousValue !== null && previousValue !== undefined) {
          await devices.setAutomationTarget(
            device.room_id,
            current.target_sensor_id,
            previousValue,
            transaction,
          );
        }
        await automations.update(rule.id, {
          is_active: 0,
          previous_target_value: null,
          updated_at: new Date().toISOString(),
        }, transaction);
        return;
      }

      if (current.restore_previous && current.is_active) return;
      if (!current.restore_previous &&
          now - (lastTriggeredAt.get(rule.id) || 0) < current.cooldown_seconds * 1000) return;
      const owner = await automations.findActiveForTarget(current.target_sensor_id, transaction);
      if (owner && owner.id !== current.id) return;
      const target = await devices.findById(current.target_sensor_id, transaction);
      if (!target || target.room_id !== device.room_id || target.direction !== "output") return;
      if (!current.restore_previous) {
        await devices.setAutomationTarget(
          device.room_id,
          current.target_sensor_id,
          current.target_value,
          transaction,
        );
        activated = true;
        return;
      }
      const previousValue = target.desired_state ?? target.current_state ?? 0;
      await devices.setAutomationTarget(
        device.room_id,
        current.target_sensor_id,
        current.target_value,
        transaction,
      );
      await automations.update(rule.id, {
        is_active: 1,
        previous_target_value: previousValue,
        updated_at: new Date().toISOString(),
      }, transaction);
      activated = true;
    });
    if (activated) lastTriggeredAt.set(rule.id, now);
  }
}
