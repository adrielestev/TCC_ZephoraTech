"use strict";

const { z } = require("zod");
const {
  nameField,
  emailField,
  passwordField,
  codeField,
} = require("../../shared/schemas");

module.exports = {
  registerBody: z
    .object({ name: nameField, email: emailField, password: passwordField })
    .strict(),
  loginBody: z
    .object({ email: emailField, password: z.string().min(1).max(200) })
    .strict(),
  emailBody: z.object({ email: emailField }).strict(),
  verifyEmailBody: z.object({ email: emailField, code: codeField }).strict(),
  resetPasswordBody: z
    .object({ email: emailField, code: codeField, newPassword: passwordField })
    .strict(),
};
