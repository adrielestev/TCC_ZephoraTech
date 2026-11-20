'use strict';

const service = require('./auth.service');

module.exports = {
  register: async (req, res) => res.status(202).json(await service.register(req.valid.body)),
  verifyEmail: async (req, res) => res.json(await service.verifyEmail(req.valid.body)),
  resendVerification: async (req, res) =>
    res.json(await service.resendVerification(req.valid.body)),
  login: async (req, res) => res.json(await service.login(req.valid.body)),
  forgotPassword: async (req, res) => res.json(await service.forgotPassword(req.valid.body)),
  resetPassword: async (req, res) => res.json(await service.resetPassword(req.valid.body)),
  me: async (req, res) => res.json(await service.me(req.user.id)),
};
