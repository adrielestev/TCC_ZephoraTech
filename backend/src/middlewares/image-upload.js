import multer from "multer";
import { fileTypeFromBuffer } from "file-type";
import { ApiError } from "../utils/errors.js";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    callback(null, allowedTypes.has(file.mimetype));
  },
});

export const uploadImage = upload.single("photo");

export async function validateUploadedImage(req, _res, next) {
  try {
    if (!req.file) {
      throw new ApiError(400, "Envie uma imagem no campo photo.");
    }

    const detectedType = await fileTypeFromBuffer(req.file.buffer);
    const extension = detectedType && allowedTypes.get(detectedType.mime);

    if (!extension || detectedType.mime !== req.file.mimetype) {
      throw new ApiError(400, "Arquivo de imagem invalido.");
    }

    req.file.extension = extension;
    return next();
  } catch (error) {
    return next(error);
  }
}