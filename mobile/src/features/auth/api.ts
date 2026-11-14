import { api } from '@/core/api/client';
import type { User } from '@/core/types';

interface Message {
  message: string;
}

export const authApi = {
  login: (body: { email: string; password: string }) =>
    api.post<{ token: string; user: User }>('/auth/login', body).then((r) => r.data),
  register: (body: { name: string; email: string; password: string }) =>
    api.post<Message>('/auth/register', body).then((r) => r.data),
  verifyEmail: (body: { email: string; code: string }) =>
    api.post<Message>('/auth/verify-email', body).then((r) => r.data),
  resendVerification: (body: { email: string }) =>
    api.post<Message>('/auth/resend-verification', body).then((r) => r.data),
  forgotPassword: (body: { email: string }) =>
    api.post<Message>('/auth/forgot-password', body).then((r) => r.data),
  resetPassword: (body: { email: string; code: string; newPassword: string }) =>
    api.post<Message>('/auth/reset-password', body).then((r) => r.data),
};
