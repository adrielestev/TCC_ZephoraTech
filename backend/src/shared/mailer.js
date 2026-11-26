// Envia e-mails e mantém uma caixa de saída para desenvolvimento.
'use strict';

const nodemailer = require('nodemailer');
const env = require('../config/env');

const useSmtp = Boolean(env.SMTP_HOST);

const transport = nodemailer.createTransport(
  useSmtp
    ? {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
      }
    : { jsonTransport: true },
);

// Sem SMTP (dev/test) as mensagens ficam aqui para inspeção.
const outbox = [];

async function send({ to, subject, text }) {
  await transport.sendMail({ from: env.MAIL_FROM, to, subject, text });
  if (!useSmtp) {
    outbox.push({ to, subject, text });
    if (outbox.length > 50) outbox.shift();
    if (env.NODE_ENV === 'development') console.log(`[mail] para=${to} | ${subject}\n${text}\n`);
  }
}

// Envio em segundo plano: não atrasa a resposta nem revela se o e-mail existe.
const sendInBackground = (message) =>
  send(message).catch((err) => console.error('[mail] falha no envio:', err.message));

const footer = `Ele expira em ${env.CODE_TTL_MINUTES} minutos. Se você não fez esta solicitação, ignore esta mensagem.`;

const sendVerificationCode = (to, code) =>
  sendInBackground({
    to,
    subject: 'Zephora — código de verificação de e-mail',
    text: `Seu código de verificação é ${code}.\n\n${footer}`,
  });

const sendPasswordResetCode = (to, code) =>
  sendInBackground({
    to,
    subject: 'Zephora — código para redefinir sua senha',
    text: `Seu código para redefinir a senha é ${code}.\n\n${footer}`,
  });

module.exports = { sendVerificationCode, sendPasswordResetCode, outbox };
