import { Router } from "express";
import * as controller from "../controllers/auth.controller.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  emailSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../schemas/auth.schemas.js";
import {
  registrationLimiter,
  loginLimiter,
  passwordResetLimiter,
  verificationLimiter,
  resendLimiter,
} from "../middlewares/rate-limit.middleware.js";

export const authRouter = Router();
authRouter.post(
  "/register",
  registrationLimiter,
  validate(registerSchema),
  asyncHandler(controller.register),
);
authRouter.post(
  "/verify-email",
  verificationLimiter,
  validate(verifyEmailSchema),
  asyncHandler(controller.verifyEmail),
);
authRouter.post(
  "/resend-code",
  resendLimiter,
  validate(emailSchema),
  asyncHandler(controller.resendCode),
);
authRouter.post(
  "/login",
  loginLimiter,
  validate(loginSchema),
  asyncHandler(controller.login),
);
authRouter.post(
  "/forgot-password",
  passwordResetLimiter,
  validate(emailSchema),
  asyncHandler(controller.requestPasswordReset),
);
authRouter.post(
  "/reset-password",
  passwordResetLimiter,
  validate(resetPasswordSchema),
  asyncHandler(controller.resetPassword),
);
authRouter.get("/me", authenticateUser, asyncHandler(controller.me));
