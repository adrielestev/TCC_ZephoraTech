// Define validadores de dados comuns usados pelas rotas.
'use strict';

const { z } = require('zod');

const positiveInt = z.coerce.number().int().positive();
const idParams = (...names) => z.object(Object.fromEntries(names.map((n) => [n, positiveInt])));

const nameField = z.string().trim().min(2, 'Nome muito curto').max(80);
const emailField = z.string().trim().toLowerCase().email('E-mail inválido').max(254);
// bcrypt considera apenas os 72 primeiros bytes
const passwordField = z
  .string()
  .min(8, 'A senha deve ter ao menos 8 caracteres')
  .refine((v) => Buffer.byteLength(v) <= 72, 'A senha deve ter no máximo 72 bytes');
const codeField = z.string().regex(/^\d{6}$/, 'O código deve ter 6 dígitos');

const atLeastOneField = (obj) => Object.keys(obj).length > 0;

module.exports = {
  positiveInt,
  idParams,
  nameField,
  emailField,
  passwordField,
  codeField,
  atLeastOneField,
};
