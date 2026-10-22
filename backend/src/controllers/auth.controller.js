import * as auth from "../services/auth.service.js";
import * as users from "../services/users.service.js";
import { userView } from "../serializers/user.serializer.js";

export async function register(req, res) {
  await auth.register(req.body);
  res
    .status(202)
    .json({
      message:
        "Se o cadastro puder ser concluído, enviaremos um código ao e-mail informado.",
    });
}
export async function verifyEmail(req, res) {
  await auth.verifyEmail(req.body);
  res.json({ message: "E-mail verificado" });
}
export async function resendCode(req, res) {
  await auth.resendCode(req.body.email);
  res
    .status(202)
    .json({
      message:
        "Se a conta puder receber um código, enviaremos ao e-mail informado.",
    });
}
export async function login(req, res) {
  const result = await auth.login(req.body);
  res.json({ token: result.token, user: userView(result.user) });
}
export async function requestPasswordReset(req, res) {
  await auth.requestPasswordReset(req.body.email);
  res
    .status(202)
    .json({
      message:
        "Se a conta puder receber um código, enviaremos as instruções ao e-mail informado.",
    });
}
export async function resetPassword(req, res) {
  await auth.resetPassword(req.body);
  res.json({ message: "Senha redefinida com sucesso" });
}
export async function me(req, res) {
  res.json({ user: userView(await users.getActiveUser(req.user.id)) });
}
