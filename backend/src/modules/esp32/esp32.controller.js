'use strict';

const service = require('./esp32.service');

module.exports = {
  register: async (req, res) => res.status(201).json(service.register(req.user, req.valid.body)),
  list: async (_req, res) => res.json(service.list()),
  get: async (req, res) => res.json(service.get(req.valid.params.id)),
  registerDevices: async (req, res) =>
    res.json(service.registerDevices(req.user, req.valid.params.id, req.valid.body.devices)),
  remove: async (req, res) => {
    service.remove(req.valid.params.id);
    res.status(204).end();
  },
};
