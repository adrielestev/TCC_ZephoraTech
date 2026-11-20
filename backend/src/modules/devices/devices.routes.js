'use strict';

const { Router } = require('express');
const validate = require('../../shared/middlewares/validate');
const authenticate = require('../../shared/middlewares/authenticate');
const { requireAdmin } = require('../../shared/middlewares/authorize');
const schemas = require('./devices.schemas');
const controller = require('./devices.controller');

const router = Router();
router.use(authenticate);

router.get('/', validate({ query: schemas.listQuery }), controller.listByRoom); // ?roomId=
router.put(
  '/:id/state',
  validate({ params: schemas.idParams, body: schemas.stateBody }),
  controller.setState,
);
router.patch(
  '/:id',
  requireAdmin,
  validate({ params: schemas.idParams, body: schemas.updateBody }),
  controller.update,
);
router.delete('/:id', requireAdmin, validate({ params: schemas.idParams }), controller.remove);

module.exports = router;
