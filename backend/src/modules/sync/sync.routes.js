'use strict';

const { Router } = require('express');
const validate = require('../../shared/middlewares/validate');
const authenticateEsp32 = require('../../shared/middlewares/authenticateEsp32');
const { esp32Failures, esp32 } = require('../../shared/middlewares/rateLimiters');
const schemas = require('./sync.schemas');
const controller = require('./sync.controller');

const router = Router();

// ESP32 -> API: autenticação por credencial (sem JWT)
router.post(
  '/',
  esp32Failures,
  authenticateEsp32,
  esp32,
  validate({ body: schemas.syncBody }),
  controller.sync,
);

module.exports = router;
