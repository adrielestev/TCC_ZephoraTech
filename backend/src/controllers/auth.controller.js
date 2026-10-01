import * as authService from "../services/auth.service.js";
import { sanitizeUser } from "../services/users.service.js";

export async function register(req, res) {
  await authService.register(req.body);

  res.status(202).json({
    message: "Se o cadastro puder ser concluido, enviaremos as instrucoes por e-mail.",
  });
}

export async function verifyEmail(req, res) {
  const message = await authService.verifyEmail(req.body.email, req.body.code);
  res.json({ message });
}

export async function resendCode(req, res) {
  await authService.resendCode(req.body.email);
  res.json({ message: "Se a conta puder receber um codigo, ele sera enviado." });
}

export async function login(req, res) {
  const data = await authService.login(req.body.email, req.body.password);
  res.json(data);
}

export async function forgotPassword(req, res) {
  await authService.forgotPassword(req.body.email);
  res.json({
    message: "Se a conta puder receber instrucoes, elas serao enviadas por e-mail.",
  });
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
