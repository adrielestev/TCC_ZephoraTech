import { api } from "./client";
import { User } from "../types";

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post("/auth/register", data),

  verifyEmail: (data: { email: string; code: string }) => api.post("/auth/verify-email", data),

  resendCode: (data: { email: string }) => api.post("/auth/resend-code", data),

  requestPasswordReset: (data: { email: string }) => api.post("/auth/forgot-password", data),

  resetPassword: (data: { email: string; code: string; password: string }) =>
    api.post("/auth/reset-password", data),

  login: (data: { email: string; password: string }) =>
    api.post<{ token: string; user: User }>("/auth/login", data),

  me: () => api.get<{ user: User }>("/auth/me"),
};
