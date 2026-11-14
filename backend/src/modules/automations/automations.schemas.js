"use strict";

const { z } = require("zod");
const { idParams, positiveInt } = require("../../shared/schemas");

const name = z.string().trim().min(2).max(100);
const unique = (items) =>
  new Set(items.map((i) => i.deviceId)).size === items.length;

const trigger = z
  .object({ deviceId: positiveInt, condition: z.record(z.unknown()) })
  .strict();
const action = z
  .object({ deviceId: positiveInt, state: z.record(z.unknown()) })
  .strict();

module.exports = {
  idParams: idParams("id"),
  listQuery: z.object({ roomId: positiveInt }),
  createBody: z
    .object({
      roomId: positiveInt,
      name,
      triggers: z
        .array(trigger)
        .min(1)
        .max(5)
        .refine(unique, "Aparelho repetido nos gatilhos"),
      actions: z
        .array(action)
        .min(1)
        .max(10)
        .refine(unique, "Aparelho repetido nas ações"),
    })
    .strict(),
  renameBody: z.object({ name }).strict(),
  pauseBody: z.object({ paused: z.boolean() }).strict(),
};
