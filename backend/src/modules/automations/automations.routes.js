'use strict';

const { Router } = require('express');
const validate = require('../../shared/middlewares/validate');
const authenticate = require('../../shared/middlewares/authenticate');
const { requireAdmin } = require('../../shared/middlewares/authorize');
const schemas = require('./automations.schemas');
const controller = require('./automations.controller');

const router = Router();
router.use(authenticate);

router.get('/', validate({ query: schemas.listQuery }), controller.listByRoom); // ?roomId=
router.post('/', requireAdmin, validate({ body: schemas.createBody }), controller.create);
router.patch(
  '/:id',
  requireAdmin,
  validate({ params: schemas.idParams, body: schemas.renameBody }),
  controller.rename,
);
router.put(
  '/:id/pause',
  validate({ params: schemas.idParams, body: schemas.pauseBody }),
  controller.setPaused,
);
router.delete('/:id', requireAdmin, validate({ params: schemas.idParams }), controller.remove);

module.exports = router;
