import multer from "multer";
import { HttpError } from "../utils/http-error.js";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const supportedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function detectImageType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: "image/jpeg", extension: "jpg" };
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { mime: "image/png", extension: "png" };
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return { mime: "image/webp", extension: "webp" };
  }
  return null;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE, files: 1, fields: 0, parts: 1 },
  fileFilter(_req, file, callback) {
    if (!supportedMimeTypes.has(file.mimetype)) return callback(new HttpError(415, "Envie uma imagem JPEG, PNG ou WebP"));
    callback(null, true);
  },
}).single("photo");

export function uploadImage(req, res, next) {
  upload(req, res, (error) => {
    if (error) return next(error);
    if (!req.file) return next(new HttpError(400, "Arquivo obrigatório no campo photo"));
    next();
  });
}

export async function validateImageContent(req, _res, next) {
  try {
    const detected = detectImageType(req.file.buffer);
    if (!detected || !supportedMimeTypes.has(detected.mime)) throw new HttpError(415, "O conteúdo não é uma imagem JPEG, PNG ou WebP válida");
    req.validatedImage = { buffer: req.file.buffer, mime: detected.mime, extension: detected.extension };
    next();
  } catch (error) {
    next(error);
  }
}
