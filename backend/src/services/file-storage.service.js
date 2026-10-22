import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { HttpError } from "../utils/http-error.js";

const uploadDirectory = fileURLToPath(new URL("../../uploads/", import.meta.url));
const validStoredName = /^[a-f0-9-]{36}\.(jpg|png|webp)$/;
const extensionByMime = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

function resolveStoredPath(filename) {
  if (!validStoredName.test(filename)) throw new HttpError(404, "Imagem não encontrada");
  const fullPath = path.resolve(uploadDirectory, filename);
  if (path.dirname(fullPath) !== path.resolve(uploadDirectory)) throw new HttpError(404, "Imagem não encontrada");
  return fullPath;
}

export async function saveImage(image) {
  const extension = extensionByMime[image.mime];
  if (!extension) throw new HttpError(415, "Tipo de imagem não permitido");
  await fs.mkdir(uploadDirectory, { recursive: true, mode: 0o700 });
  const filename = `${crypto.randomUUID()}.${extension}`;
  const fullPath = resolveStoredPath(filename);
  await fs.writeFile(fullPath, image.buffer, { flag: "wx", mode: 0o600 });
  return filename;
}

export async function deleteImage(filename) {
  if (!filename || !validStoredName.test(filename)) return;
  const fullPath = resolveStoredPath(filename);
  try {
    await fs.unlink(fullPath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

export async function readImage(filename) {
  const fullPath = resolveStoredPath(filename);
  try {
    const buffer = await fs.readFile(fullPath);
    const extension = path.extname(filename).slice(1);
    const mime = extension === "jpg" ? "image/jpeg" : `image/${extension}`;
    return { buffer, mime };
  } catch (error) {
    if (error.code === "ENOENT") throw new HttpError(404, "Imagem não encontrada");
    throw error;
  }
}
