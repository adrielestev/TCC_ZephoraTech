"use strict";

class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(
    message = "Requisição inválida",
    code = "BAD_REQUEST",
    details,
  ) {
    return new AppError(400, code, message, details);
  }
  static unauthorized(message = "Não autenticado", code = "UNAUTHORIZED") {
    return new AppError(401, code, message);
  }
  static forbidden(
    message = "Sem permissão para esta ação",
    code = "FORBIDDEN",
  ) {
    return new AppError(403, code, message);
  }
  static notFound(message = "Recurso não encontrado", code = "NOT_FOUND") {
    return new AppError(404, code, message);
  }
  static conflict(message = "Conflito de dados", code = "CONFLICT") {
    return new AppError(409, code, message);
  }
}

module.exports = AppError;
