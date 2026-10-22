import rateLimit from "express-rate-limit";

const createLimiter = (limit, windowMs) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Muitas tentativas. Aguarde e tente novamente." },
  });

export const registrationLimiter = createLimiter(5, 60 * 60 * 1000);
export const loginLimiter = createLimiter(10, 15 * 60 * 1000);
export const verificationLimiter = createLimiter(8, 15 * 60 * 1000);
export const resendLimiter = createLimiter(3, 60 * 60 * 1000);
export const passwordResetLimiter = createLimiter(5, 15 * 60 * 1000);
export const deviceHandshakeLimiter = createLimiter(10, 15 * 60 * 1000);
export const imageUploadLimiter = createLimiter(10, 15 * 60 * 1000);
