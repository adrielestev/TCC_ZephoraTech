'use strict';

const { Router } = require('express');
const validate = require('../../shared/middlewares/validate');
const authenticate = require('../../shared/middlewares/authenticate');
const { requireAdmin } = require('../../shared/middlewares/authorize');
const schemas = require('./esp32.schemas');
const controller = require('./esp32.controller');

const router = Router();
router.use(authenticate, requireAdmin);

router.post('/', validate({ body: schemas.registerBody }), controller.register);
router.get('/', controller.list);
router.get('/:id', validate({ params: schemas.idParams }), controller.get);
router.post(
  '/:id/devices',
  validate({ params: schemas.idParams, body: schemas.registerDevicesBody }),
  controller.registerDevices,
);
router.delete('/:id', validate({ params: schemas.idParams }), controller.remove);

module.exports = router;
