// src/features/auth/schemas.ts -- Define as regras de validação dos formulários de autenticação.
import { z } from 'zod';

const email = z.string().trim().min(1, 'Informe o e-mail').pipe(z.email('E-mail inválido'));
const password = z
  .string()
  .min(8, 'A senha deve ter ao menos 8 caracteres')
  .max(72, 'A senha deve ter no máximo 72 caracteres');
const code = z.string().regex(/^\d{6}$/, 'O código tem 6 dígitos');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Informe a senha'),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe seu nome').max(80),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem',
  });

export const emailSchema = z.object({ email });

export const verifyEmailSchema = z.object({ email, code });

export const resetPasswordSchema = z
  .object({ email, code, newPassword: password, confirmPassword: z.string() })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem',
  });

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type EmailForm = z.infer<typeof emailSchema>;
export type VerifyEmailForm = z.infer<typeof verifyEmailSchema>;
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
