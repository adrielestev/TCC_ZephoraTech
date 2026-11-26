// Liga as requisições de salas às funções do serviço.
'use strict';

const service = require('./rooms.service');

module.exports = {
  list: async (req, res) => res.json(service.list(req.user)),
  get: async (req, res) => res.json(service.get(req.user, req.valid.params.roomId)),
  create: async (req, res) => res.status(201).json(service.create(req.user, req.valid.body)),
  update: async (req, res) => res.json(service.update(req.valid.params.roomId, req.valid.body)),
  remove: async (req, res) => {
    await service.remove(req.valid.params.roomId);
    res.status(204).end();
  },
  setPhoto: async (req, res) =>
    res.json(await service.setPhoto(req.valid.params.roomId, req.valid.params.slot, req.file)),
  removePhoto: async (req, res) =>
    res.json(await service.removePhoto(req.valid.params.roomId, req.valid.params.slot)),
  listAccess: async (req, res) => res.json(service.listAccess(req.valid.params.roomId)),
};
