'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const env = require('../config/env');
const AppError = require('./errors');

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Detecta o tipo real pelos bytes iniciais (não confia no mimetype enviado pelo cliente). */
function detectImageExtension(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length >= 8 && buf.subarray(0, 8).equals(PNG_SIGNATURE)) return 'png';
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'webp';
  }
  return null;
}

function resolveUploadPath(relativePath) {
  const absolute = path.resolve(env.UPLOAD_DIR, relativePath);
  if (!absolute.startsWith(env.UPLOAD_DIR + path.sep))
    throw new Error('Caminho de arquivo inválido');
  return absolute;
}

/** Salva a imagem enviada (multer memoryStorage) e devolve o caminho relativo. */
async function saveImage(file, folder) {
  if (!file) throw AppError.badRequest('Envie uma imagem no campo esperado', 'FILE_REQUIRED');
  const extension = detectImageExtension(file.buffer);
  if (!extension)
    throw AppError.badRequest('Formato inválido. Use JPEG, PNG ou WebP', 'INVALID_IMAGE');

  const relativePath = `${folder}/${crypto.randomUUID()}.${extension}`;
  const absolute = resolveUploadPath(relativePath);
  await fs.promises.mkdir(path.dirname(absolute), { recursive: true });
  await fs.promises.writeFile(absolute, file.buffer, {
    flag: 'wx',
    mode: 0o640,
  });
  return relativePath;
}

async function removeFile(relativePath) {
  if (!relativePath) return;
  try {
    await fs.promises.unlink(resolveUploadPath(relativePath));
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('[files] falha ao remover arquivo:', err.message);
  }
}

const fileUrl = (relativePath) =>
  relativePath ? `${env.PUBLIC_URL}/uploads/${relativePath}` : null;

module.exports = { saveImage, removeFile, fileUrl };
