'use strict';

const multer = require('multer');

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Em memória: o conteúdo é validado (bytes reais) antes de qualquer escrita em disco.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 0 },
});

module.exports = {
  singleImage: (field) => upload.single(field),
  MAX_IMAGE_BYTES,
};
