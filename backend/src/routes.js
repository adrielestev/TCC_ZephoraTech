// Registra as rotas dos módulos da API.
'use strict';

const { Router } = require('express');

const router = Router();

router.use('/auth', require('./modules/auth/auth.routes'));
router.use('/users', require('./modules/users/users.routes'));
router.use('/rooms', require('./modules/rooms/rooms.routes'));
router.use('/esp32', require('./modules/esp32/esp32.routes'));
router.use('/devices', require('./modules/devices/devices.routes'));
router.use('/automations', require('./modules/automations/automations.routes'));
router.use('/device-sync', require('./modules/sync/sync.routes'));

module.exports = router;
