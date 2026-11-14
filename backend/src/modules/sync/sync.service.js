"use strict";

const env = require("../../config/env");
const { transaction } = require("../../database/db");
const { parseJson, sameState } = require("../../shared/json");
const esp32Repository = require("../esp32/esp32.repository");
const devicesRepository = require("../devices/devices.repository");
const { safeParseState } = require("../devices/device-types");
const automationsService = require("../automations/automations.service");

/**
 * Um único ciclo de polling do ESP32:
 *  1. marca o módulo como online;
 *  2. grava os aparelhos reportados (novos viram "descobertos") e seus estados;
 *  3. avalia automações disparadas por mudanças em sensores cadastrados;
 *  4. devolve os comandos pendentes (estado desejado diferente do atual).
 */
function sync(esp32, { firmware, devices: reported }) {
  return transaction(() => {
    esp32Repository.touch(esp32.id, firmware ?? null);

    const known = new Map(
      devicesRepository.listByEsp32(esp32.id).map((d) => [d.channel, d]),
    );
    const changedRegistered = [];

    for (const item of reported) {
      const state =
        item.state === undefined ? null : safeParseState(item.type, item.state);
      const existing = known.get(item.channel);

      if (!existing) {
        devicesRepository.insertDiscovered(esp32.id, {
          channel: item.channel,
          type: item.type,
          name: item.name ?? item.channel,
          currentState: state ? JSON.stringify(state) : null,
        });
        continue;
      }
      if (existing.type !== item.type || !state) continue; // tipo divergente ou estado inválido: ignora

      if (!sameState(parseJson(existing.current_state), state)) {
        devicesRepository.updateReported(existing.id, JSON.stringify(state));
        if (existing.registration_status === "registered")
          changedRegistered.push(existing.id);
      }
    }

    automationsService.evaluateTriggers(changedRegistered);

    const commands = devicesRepository
      .listByEsp32(esp32.id)
      .filter(
        (d) =>
          d.registration_status === "registered" &&
          d.desired_state !== null &&
          !sameState(parseJson(d.desired_state), parseJson(d.current_state)),
      )
      .map((d) => ({ channel: d.channel, state: parseJson(d.desired_state) }));

    return {
      serverTime: new Date().toISOString(),
      pollIntervalMs: env.ESP32_POLL_INTERVAL_MS,
      commands,
    };
  });
}

module.exports = { sync };
