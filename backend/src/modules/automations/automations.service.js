'use strict';

const AppError = require('../../shared/errors');
const { transaction } = require('../../database/db');
const { parseJson, sameState, isSubset } = require('../../shared/json');
const roomsService = require('../rooms/rooms.service');
const devicesRepository = require('../devices/devices.repository');
const { isControllable, parseState } = require('../devices/device-types');
const repository = require('./automations.repository');

function buildAutomations(rows) {
  const links = repository.listLinks(rows.map((r) => r.id));
  return rows.map((row) => {
    const own = links.filter((l) => l.automation_id === row.id);
    return {
      id: row.id,
      roomId: row.room_id,
      name: row.name,
      isPaused: Boolean(row.is_paused),
      pausedBy: row.paused_by,
      pausedAt: row.paused_at,
      triggers: own
        .filter((l) => l.role === 'trigger')
        .map((l) => ({
          deviceId: l.device_id,
          condition: parseJson(l.config),
        })),
      actions: own
        .filter((l) => l.role === 'action')
        .map((l) => ({ deviceId: l.device_id, state: parseJson(l.config) })),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
}

const notFound = () => AppError.notFound('Automação não encontrada', 'AUTOMATION_NOT_FOUND');

function getAccessible(user, id) {
  const automation = repository.findById(id);
  if (!automation) throw notFound();
  roomsService.getAccessible(user, automation.room_id); // 404 sem acesso à sala
  return automation;
}

const getOne = (id) => buildAutomations([repository.findById(id)])[0];

function listByRoom(user, roomId) {
  roomsService.getAccessible(user, roomId);
  return { data: buildAutomations(repository.listByRoom(roomId)) };
}

/** Todos os aparelhos precisam estar cadastrados e na mesma sala da automação. */
function loadRoomDevices(roomId, deviceIds) {
  const devices = new Map(devicesRepository.findByIds(deviceIds).map((d) => [d.id, d]));
  for (const id of deviceIds) {
    const device = devices.get(id);
    if (!device || device.registration_status !== 'registered' || device.room_id !== roomId) {
      throw AppError.badRequest(
        `O aparelho ${id} não está cadastrado nesta sala`,
        'DEVICE_NOT_IN_ROOM',
      );
    }
  }
  return devices;
}

function create(user, { roomId, name, triggers, actions }) {
  roomsService.getOrFail(roomId);
  const devices = loadRoomDevices(
    roomId,
    [...triggers, ...actions].map((i) => i.deviceId),
  );
  const links = [];

  for (const t of triggers) {
    const device = devices.get(t.deviceId);
    if (isControllable(device.type)) {
      throw AppError.badRequest(
        `O aparelho ${device.id} não é um sensor e não pode ser gatilho`,
        'INVALID_TRIGGER',
      );
    }
    links.push({
      deviceId: device.id,
      role: 'trigger',
      config: parseState(device.type, t.condition, { partial: true }),
    });
  }
  for (const a of actions) {
    const device = devices.get(a.deviceId);
    if (!isControllable(device.type)) {
      throw AppError.badRequest(`O aparelho ${device.id} não pode receber ações`, 'INVALID_ACTION');
    }
    links.push({
      deviceId: device.id,
      role: 'action',
      config: parseState(device.type, a.state),
    });
  }

  const id = transaction(() => repository.insert({ roomId, name, createdBy: user.id, links }));
  return getOne(id);
}

function rename(id, name) {
  if (!repository.findById(id)) throw notFound();
  repository.updateName(id, name);
  return getOne(id);
}

/** Usuários comuns com acesso à sala podem pausar/retomar. */
function setPaused(user, id, paused) {
  getAccessible(user, id);
  repository.setPaused(id, paused, user.id);
  return getOne(id);
}

function remove(id) {
  if (!repository.findById(id)) throw notFound();
  repository.remove(id);
}

/**
 * Avalia as automações cujos gatilhos tiveram o estado alterado (borda, não nível).
 * Todos os gatilhos precisam estar satisfeitos (AND). Chamado pela sincronização do ESP32.
 */
function evaluateTriggers(changedDeviceIds) {
  const seen = new Set();
  for (const deviceId of changedDeviceIds) {
    for (const automation of repository.findActiveByTriggerDevice(deviceId)) {
      if (seen.has(automation.id)) continue;
      seen.add(automation.id);

      const links = repository.listLinks([automation.id]);
      const devices = new Map(
        devicesRepository.findByIds(links.map((l) => l.device_id)).map((d) => [d.id, d]),
      );

      const fired = links
        .filter((l) => l.role === 'trigger')
        .every((l) => {
          const d = devices.get(l.device_id);
          return (
            d?.registration_status === 'registered' &&
            isSubset(parseJson(l.config), parseJson(d.current_state))
          );
        });
      if (!fired) continue;

      for (const link of links.filter((l) => l.role === 'action')) {
        const d = devices.get(link.device_id);
        if (!d || d.registration_status !== 'registered') continue;
        const target = parseJson(link.config);
        const effective = parseJson(d.desired_state) ?? parseJson(d.current_state);
        if (!sameState(effective, target))
          devicesRepository.setDesiredState(d.id, JSON.stringify(target));
      }
    }
  }
}

module.exports = {
  listByRoom,
  create,
  rename,
  setPaused,
  remove,
  evaluateTriggers,
};
