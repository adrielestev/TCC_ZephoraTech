'use strict';

const service = require('./automations.service');

module.exports = {
  listByRoom: async (req, res) => res.json(service.listByRoom(req.user, req.valid.query.roomId)),
  create: async (req, res) => res.status(201).json(service.create(req.user, req.valid.body)),
  rename: async (req, res) => res.json(service.rename(req.valid.params.id, req.valid.body.name)),
  setPaused: async (req, res) =>
    res.json(service.setPaused(req.user, req.valid.params.id, req.valid.body.paused)),
  remove: async (req, res) => {
    service.remove(req.valid.params.id);
    res.status(204).end();
  },
};
