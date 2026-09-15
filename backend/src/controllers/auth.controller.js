import * as authService from "../services/auth.service.js";
import { sanitizeUser } from "../services/users.service.js";

export async function register(req, res) {
  const user = await authService.register(req.body);

  res.status(201).json({
    message: "Usuario criado. Verifique seu e-mail para ativar a conta.",
    user,
  });
}

export async function verifyEmail(req, res) {
  const message = await authService.verifyEmail(req.body.email, req.body.code);
  res.json({ message });
}

export async function resendCode(req, res) {
  await authService.resendCode(req.body.email);
  res.json({ message: "Codigo reenviado." });
}

export async function login(req, res) {
  const data = await authService.login(req.body.email, req.body.password);
  res.json(data);
}

export async function forgotPassword(req, res) {
  await authService.forgotPassword(req.body.email);
  res.json({ message: "Codigo de redefinicao enviado." });
}

export async function resetPassword(req, res) {
  await authService.resetPassword(
    req.body.email,
    req.body.code,
    req.body.password,
  );
  res.json({ message: "Senha redefinida com sucesso." });
}

export async function me(req, res) {
  res.json({ user: sanitizeUser(req.user) });
}
