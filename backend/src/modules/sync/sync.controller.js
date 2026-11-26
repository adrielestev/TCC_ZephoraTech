// Liga a requisição de sincronização do ESP32 ao serviço.
'use strict';

const service = require('./sync.service');

module.exports = {
  sync: async (req, res) => res.json(service.sync(req.esp32, req.valid.body)),
};
