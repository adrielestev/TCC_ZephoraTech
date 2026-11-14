"use strict";

const { z } = require("zod");
const { idParams, positiveInt, nameField } = require("../../shared/schemas");
const { CREDENTIAL_REGEX } = require("../../shared/crypto");

module.exports = {
  idParams: idParams("id"),
  registerBody: z
    .object({
      credential: z
        .string()
        .regex(
          CREDENTIAL_REGEX,
          "Credencial inválida (32–128 caracteres: letras, números, - e _)",
        ),
      name: nameField.optional(),
    })
    .strict(),
  registerDevicesBody: z
    .object({
      devices: z
        .array(
          z
            .object({
              deviceId: positiveInt,
              roomId: positiveInt,
              name: nameField.optional(),
            })
            .strict(),
        )
        .min(1)
        .max(32)
        .refine(
          (items) =>
            new Set(items.map((i) => i.deviceId)).size === items.length,
          "Aparelho repetido",
        ),
    })
    .strict(),
};
