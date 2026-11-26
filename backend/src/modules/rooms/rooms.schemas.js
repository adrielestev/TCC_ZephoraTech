// Valida os dados recebidos nas operações com salas.
'use strict';

const { z } = require('zod');
const { idParams, positiveInt, atLeastOneField } = require('../../shared/schemas');

const name = z.string().trim().min(2).max(80);
const description = z.string().trim().max(500).nullable();

module.exports = {
  roomParams: idParams('roomId'),
  photoParams: z.object({
    roomId: positiveInt,
    slot: z.coerce.number().int().min(1).max(3),
  }),
  createBody: z.object({ name, description: description.optional() }).strict(),
  updateBody: z
    .object({ name: name.optional(), description: description.optional() })
    .strict()
    .refine(atLeastOneField, 'Informe ao menos um campo'),
};
