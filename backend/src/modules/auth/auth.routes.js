// Define as rotas de cadastro, login e recuperação de acesso.
'use strict';

const { Router } = require('express');
const validate = require('../../shared/middlewares/validate');
const authenticate = require('../../shared/middlewares/authenticate');
const { auth, authByEmail } = require('../../shared/middlewares/rateLimiters');
const schemas = require('./auth.schemas');
const controller = require('./auth.controller');

const router = Router();

router.post('/register', auth, validate({ body: schemas.registerBody }), controller.register);
router.post('/login', auth, authByEmail, validate({ body: schemas.loginBody }), controller.login);
router.post(
  '/verify-email',
  authByEmail,
  validate({ body: schemas.verifyEmailBody }),
  controller.verifyEmail,
);
router.post(
  '/resend-verification',
  authByEmail,
  validate({ body: schemas.emailBody }),
  controller.resendVerification,
);
router.post(
  '/forgot-password',
  authByEmail,
  validate({ body: schemas.emailBody }),
  controller.forgotPassword,
);
router.post(
  '/reset-password',
  authByEmail,
  validate({ body: schemas.resetPasswordBody }),
  controller.resetPassword,
);
router.get('/me', authenticate, controller.me);

module.exports = router;
