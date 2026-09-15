import { ZodError } from "zod";
import multer from "multer";

export function notFoundHandler(req, _res, next) {
  next({
    statusCode: 404,
    message: `Rota ${req.method} ${req.originalUrl} nao encontrada.`,
  });
}

export function errorHandler(error, _req, res, _next) {
  if (error instanceof multer.MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "A imagem deve ter no maximo 5 MB."
        : "Upload de imagem invalido.";
    return res.status(400).json({ error: message });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "Dados invalidos.",
      details: error.flatten(),
    });
  }

  const statusCode = error.statusCode || 500;

  if (error.code === "SQLITE_CONSTRAINT") {
    return res.status(409).json({
      error:
        "Registro viola uma regra de unicidade, relacionamento ou validacao do banco.",
      details: error.message,
    });
  }

  return res.status(statusCode).json({
    error: statusCode >= 500 ? "Erro interno do servidor." : error.message,
    details: error.details,
  });
}
