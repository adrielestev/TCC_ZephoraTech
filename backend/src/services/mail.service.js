import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transport;
function getTransport() {
  if (transport) return transport;
  transport = nodemailer.createTransport({
    host: env.SMTP_HOST.trim(),
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE === "true",
    auth: env.SMTP_USER
      ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
      : undefined,
  });
  return transport;
}

async function sendCode({ email, code, subject, text, purpose, ttlMinutes }) {
  if (!env.SMTP_HOST?.trim()) {
    if (env.NODE_ENV === "development") {
      console.info(
        `[Zephora] SMTP não configurado. Código de ${purpose} para ${email}: ${code} (expira em ${ttlMinutes} minutos)`,
      );
      return;
    }

    throw new Error("SMTP_HOST não configurado; e-mail não enviado.");
  }

  await getTransport().sendMail({
    from: env.MAIL_FROM,
    to: email,
    subject,
    text,
  });
}

export async function sendVerification(email, code) {
  await sendCode({
    email,
    code,
    purpose: "verificação",
    ttlMinutes: env.VERIFICATION_CODE_TTL_MINUTES,
    subject: "Código de verificação Zephora",
    text: `Seu código é ${code}. Ele expira em ${env.VERIFICATION_CODE_TTL_MINUTES} minutos.`,
  });
}

export async function sendPasswordReset(email, code) {
  await sendCode({
    email,
    code,
    purpose: "recuperação de senha",
    ttlMinutes: env.PASSWORD_RESET_TTL_MINUTES,
    subject: "Recuperação de senha Zephora",
    text: `Seu código para redefinir a senha é ${code}. Ele expira em ${env.PASSWORD_RESET_TTL_MINUTES} minutos. Se você não solicitou a recuperação, ignore esta mensagem.`,
  });
}
