export class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function notFound(resource = "Recurso") {
  return new ApiError(404, `${resource} nao encontrado.`);
}
