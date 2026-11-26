// Liga as requisições de aparelhos às funções do serviço.
'use strict';

const service = require('./devices.service');

module.exports = {
  listByRoom: async (req, res) => res.json(service.listByRoom(req.user, req.valid.query.roomId)),
  setState: async (req, res) =>
    res.json(service.setState(req.user, req.valid.params.id, req.valid.body.state)),
  update: async (req, res) => res.json(service.update(req.valid.params.id, req.valid.body)),
  remove: async (req, res) => {
    service.remove(req.valid.params.id);
    res.status(204).end();
  },
};
