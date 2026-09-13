import nodemailer from "nodemailer";
import { env } from "../config/env.js";

function createTransporter() {
  if (!env.SMTP_HOST) {
    return nodemailer.createTransport({ jsonTransport: true });
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER
      ? {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS
        }
      : undefined
  });
}

const transporter = createTransporter();

export async function sendVerificationCode({ to, name, code, purpose }) {
  const subject =
    purpose === "password-reset"
      ? `${env.APP_NAME}: codigo para redefinir senha`
      : `${env.APP_NAME}: confirme seu e-mail`;

  const text = [
    `Ola, ${name}.`,
    "",
    `Seu codigo do ${env.APP_NAME} e: ${code}`,
    `Ele expira em ${env.VERIFICATION_CODE_TTL_MINUTES} minutos.`,
    "",
    "Se voce nao solicitou este codigo, ignore este e-mail."
  ].join("\n");

  const info = await transporter.sendMail({
    from: env.MAIL_FROM,
    to,
    subject,
    text
  });

  if (!env.SMTP_HOST && info.message) {
    console.info("E-mail gerado em modo desenvolvimento:", info.message);
  }

  return info;
}
