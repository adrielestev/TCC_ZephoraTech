'use strict';

const service = require('./sync.service');

module.exports = {
  sync: async (req, res) => res.json(service.sync(req.esp32, req.valid.body)),
};
