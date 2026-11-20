'use strict';

const { z } = require('zod');
const { idParams, nameField, positiveInt, atLeastOneField } = require('../../shared/schemas');

module.exports = {
  idParams: idParams('id'),
  listQuery: z.object({
    q: z.string().trim().max(100).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
  }),
  updateMeBody: z
    .object({ name: nameField })
    .strict()
    .refine(atLeastOneField, 'Informe ao menos um campo'),
  roleBody: z.object({ role: z.enum(['admin', 'member']) }).strict(),
  statusBody: z.object({ isActive: z.boolean() }).strict(),
  roomsBody: z.object({ roomIds: z.array(positiveInt).max(200) }).strict(),
};
