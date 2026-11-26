// Valida os dados recebidos nas operações com aparelhos.
'use strict';

const { z } = require('zod');
const { idParams, positiveInt, nameField, atLeastOneField } = require('../../shared/schemas');

module.exports = {
  idParams: idParams('id'),
  listQuery: z.object({ roomId: positiveInt }),
  stateBody: z.object({ state: z.record(z.unknown()) }).strict(),
  updateBody: z
    .object({
      name: nameField.optional(),
      roomId: positiveInt.optional(),
      executionConfig: z.record(z.unknown()).optional(),
    })
    .strict()
    .refine(atLeastOneField, 'Informe ao menos um campo'),
};
