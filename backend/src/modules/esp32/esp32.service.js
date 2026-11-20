'use strict';

const AppError = require('../../shared/errors');
const { transaction, isUniqueViolation } = require('../../database/db');
const { sha256 } = require('../../shared/crypto');
const { esp32Status } = require('../../shared/esp32-status');
const roomsRepository = require('../rooms/rooms.repository');
const devicesRepository = require('../devices/devices.repository');
const devicesService = require('../devices/devices.service');
const automationsRepository = require('../automations/automations.repository');
const repository = require('./esp32.repository');

const toPublic = (m) => ({
  id: m.id,
  name: m.name,
  credentialHint: m.credential_hint,
  status: esp32Status(m.last_seen_at),
  firmwareVersion: m.firmware_version,
  lastSeenAt: m.last_seen_at,
  registeredDevices: m.registered_count,
  discoveredDevices: m.discovered_count,
  createdAt: m.created_at,
});

function getOrFail(id) {
  const module_ = repository.findById(id);
  if (!module_) throw AppError.notFound('ESP32 não encontrado', 'ESP32_NOT_FOUND');
  return module_;
}

/** Passo 1: o admin informa a credencial única gerada pelo ESP32. Guardamos apenas o hash. */
function register(user, { credential, name }) {
  try {
    return toPublic(
      repository.insert({
        credentialHash: sha256(credential),
        credentialHint: credential.slice(-4),
        name,
        registeredBy: user.id,
      }),
    );
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw AppError.conflict('Esta credencial já está cadastrada', 'ESP32_ALREADY_REGISTERED');
    }
    throw err;
  }
}

const list = () => ({ data: repository.list().map(toPublic) });

/** Passo 2: status do ESP32 e lista de aparelhos que ele reportou (descobertos e cadastrados). */
function get(id) {
  const module_ = getOrFail(id);
  return {
    ...toPublic(module_),
    devices: devicesRepository.listByEsp32(id).map(devicesService.toPublic),
  };
}

/** Passo 3: o admin escolhe quais aparelhos adicionar (todos ou alguns) e em qual sala. */
function registerDevices(user, esp32Id, items) {
  const module_ = getOrFail(esp32Id);
  if (esp32Status(module_.last_seen_at) !== 'online') {
    throw AppError.conflict(
      'O ESP32 ainda não está operacional. Ligue-o e aguarde a primeira sincronização',
      'ESP32_NOT_OPERATIONAL',
    );
  }

  transaction(() => {
    for (const item of items) {
      const device = devicesRepository.findById(item.deviceId);
      if (!device || device.esp32_id !== module_.id) {
        throw AppError.notFound('Aparelho não encontrado neste ESP32', 'DEVICE_NOT_FOUND');
      }
      if (device.registration_status !== 'discovered') {
        throw AppError.conflict(
          `O aparelho ${device.id} já está cadastrado`,
          'DEVICE_ALREADY_REGISTERED',
        );
      }
      if (!roomsRepository.findById(item.roomId)) {
        throw AppError.notFound('Sala não encontrada', 'ROOM_NOT_FOUND');
      }
      devicesRepository.register(device.id, {
        roomId: item.roomId,
        name: item.name ?? device.name,
        userId: user.id,
      });
    }
  });
  return get(esp32Id);
}

function remove(id) {
  getOrFail(id);
  transaction(() => {
    repository.remove(id); // apaga os aparelhos em cascata
    automationsRepository.removeIncomplete();
  });
}

module.exports = { register, list, get, registerDevices, remove };
