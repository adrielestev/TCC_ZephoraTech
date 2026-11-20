'use strict';

const AppError = require('../../shared/errors');
const { transaction } = require('../../database/db');
const { parseJson } = require('../../shared/json');
const { esp32Status } = require('../../shared/esp32-status');
const roomsService = require('../rooms/rooms.service');
const roomsRepository = require('../rooms/rooms.repository');
const automationsRepository = require('../automations/automations.repository');
const devicesRepository = require('./devices.repository');
const {
  isControllable,
  parseState,
  parseExecutionConfig,
  getExecutionConfig,
} = require('./device-types');

const toPublic = (device) => ({
  id: device.id,
  esp32Id: device.esp32_id,
  roomId: device.room_id,
  name: device.name,
  type: device.type,
  channel: device.channel,
  registrationStatus: device.registration_status,
  controllable: isControllable(device.type),
  desiredState: parseJson(device.desired_state),
  currentState: parseJson(device.current_state),
  executionConfig: getExecutionConfig(device.type, parseJson(device.execution_config)),
  stateUpdatedAt: device.state_updated_at,
  esp32Status: esp32Status(device.esp32_last_seen_at),
});

const deviceNotFound = () => AppError.notFound('Aparelho não encontrado', 'DEVICE_NOT_FOUND');

/** Aparelho cadastrado, acessível ao usuário (sem acesso à sala = 404). */
function getAccessible(user, deviceId) {
  const device = devicesRepository.findById(deviceId);
  if (!device || device.registration_status !== 'registered') throw deviceNotFound();
  roomsService.getAccessible(user, device.room_id);
  return device;
}

function listByRoom(user, roomId) {
  roomsService.getAccessible(user, roomId);
  return { data: devicesRepository.listRegisteredByRoom(roomId).map(toPublic) };
}

/** Define o estado desejado; o ESP32 aplica na próxima sincronização. */
function setState(user, deviceId, state) {
  const device = getAccessible(user, deviceId);
  if (!isControllable(device.type)) {
    throw AppError.badRequest('Este aparelho não pode ser controlado', 'DEVICE_NOT_CONTROLLABLE');
  }
  const parsed = parseState(device.type, state);
  devicesRepository.setDesiredState(device.id, JSON.stringify(parsed));
  return toPublic(devicesRepository.findById(device.id));
}

function update(deviceId, patch) {
  const device = devicesRepository.findById(deviceId);
  if (!device || device.registration_status !== 'registered') throw deviceNotFound();

  if (patch.roomId !== undefined && patch.roomId !== device.room_id) {
    if (!roomsRepository.findById(patch.roomId)) {
      throw AppError.notFound('Sala não encontrada', 'ROOM_NOT_FOUND');
    }
    if (automationsRepository.usesDevice(device.id)) {
      throw AppError.conflict(
        'Remova o aparelho das automações antes de movê-lo de sala',
        'DEVICE_IN_AUTOMATION',
      );
    }
  }
  if (patch.executionConfig !== undefined) {
    const parsed = parseExecutionConfig(device.type, patch.executionConfig);
    devicesRepository.setExecutionConfig(device.id, JSON.stringify(parsed));
  }
  devicesRepository.update(device.id, patch);
  return toPublic(devicesRepository.findById(device.id));
}

/** Remove o cadastro; o ESP32 volta a reportá-lo como "descoberto". */
function remove(deviceId) {
  const device = devicesRepository.findById(deviceId);
  if (!device) throw deviceNotFound();
  transaction(() => {
    devicesRepository.remove(device.id);
    automationsRepository.removeIncomplete();
  });
}

module.exports = {
  toPublic,
  getAccessible,
  listByRoom,
  setState,
  update,
  remove,
};
