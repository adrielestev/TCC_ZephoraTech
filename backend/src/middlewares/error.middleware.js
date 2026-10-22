import { HttpError } from "../utils/http-error.js";

export function notFound(_req, _res, next) {
  next(new HttpError(404, "Rota não encontrada"));
}

export function errorHandler(error, _req, res, _next) {
  if (error?.name === "MulterError") {
    const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    const message = error.code === "LIMIT_FILE_SIZE"
      ? "A imagem excede o limite de 5 MB"
      : "Envie somente uma imagem no campo photo";
    return res.status(status).json({ error: message });
  }
  if (error?.type === "entity.parse.failed") return res.status(400).json({ error: "JSON inválido" });
  if (error?.type === "entity.too.large") return res.status(413).json({ error: "Corpo da requisição excede o limite" });
  if (/unique constraint failed/i.test(error?.message || "")) {
    return res.status(409).json({ error: "Registro duplicado" });
  }
  if (error?.code?.startsWith("SQLITE_CONSTRAINT")) {
    return res.status(400).json({ error: "Dados incompatíveis com o recurso" });
  }
  const status = error instanceof HttpError
    ? error.status
    : Number.isInteger(error?.status) && error.status >= 400 && error.status < 500 ? error.status : 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ error: status >= 500 ? "Erro interno" : error.message || "Requisição inválida" });
}
