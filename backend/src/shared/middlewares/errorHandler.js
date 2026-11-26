// Converte erros da aplicação em respostas HTTP padronizadas.
'use strict';

const multer = require('multer');
const { ZodError } = require('zod');
const AppError = require('../errors');
const { isUniqueViolation } = require('../../database/db');

const notFoundHandler = (_req, _res, next) =>
  next(AppError.notFound('Rota não encontrada', 'ROUTE_NOT_FOUND'));

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Erro interno do servidor';
  let details;

  if (err instanceof AppError) {
    ({ status, code, message, details } = err);
  } else if (err instanceof ZodError) {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'Dados inválidos';
    details = err.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }));
  } else if (err instanceof multer.MulterError) {
    status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    code = 'UPLOAD_ERROR';
    message =
      err.code === 'LIMIT_FILE_SIZE' ? 'Imagem muito grande (máx. 5 MB)' : 'Upload inválido';
  } else if (err?.type === 'entity.parse.failed') {
    status = 400;
    code = 'INVALID_JSON';
    message = 'JSON inválido';
  } else if (err?.type === 'entity.too.large') {
    status = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Corpo da requisição muito grande';
  } else if (isUniqueViolation(err)) {
    status = 409;
    code = 'CONFLICT';
    message = 'Registro já existente';
  } else {
    console.error(`[erro] ${req.method} ${req.originalUrl}`, err);
  }

  res.status(status).json({ error: { code, message, ...(details ? { details } : {}) } });
}

module.exports = { notFoundHandler, errorHandler };
