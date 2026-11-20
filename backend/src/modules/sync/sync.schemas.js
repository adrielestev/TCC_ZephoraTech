'use strict';

const { z } = require('zod');
const { TYPE_NAMES } = require('../devices/device-types');

const reportedDevice = z
  .object({
    channel: z.string().regex(/^[A-Za-z0-9_-]{1,32}$/),
    type: z.enum(TYPE_NAMES),
    name: z.string().trim().min(1).max(60).optional(),
    state: z.record(z.unknown()).optional(),
  })
  .strict();

module.exports = {
  syncBody: z
    .object({
      firmware: z.string().trim().max(32).optional(),
      devices: z
        .array(reportedDevice)
        .max(32)
        .refine(
          (items) => new Set(items.map((i) => i.channel)).size === items.length,
          'Canal repetido',
        ),
    })
    .strict(),
};
