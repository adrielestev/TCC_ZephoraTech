import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.js";
import {
  codeSchema,
  emailSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../schemas/auth.schemas.js";
import { asyncHandler } from "../utils/async-handler.js";
import { validate } from "../utils/validators.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  validate(registerSchema),
  asyncHandler(authController.register),
);
authRouter.post(
  "/verify-email",
  validate(codeSchema),
  asyncHandler(authController.verifyEmail),
);
authRouter.post(
  "/resend-code",
  validate(emailSchema),
  asyncHandler(authController.resendCode),
);
authRouter.post(
  "/login",
  validate(loginSchema),
  asyncHandler(authController.login),
);
authRouter.post(
  "/forgot-password",
  validate(emailSchema),
  asyncHandler(authController.forgotPassword),
);
authRouter.post(
  "/reset-password",
  validate(resetPasswordSchema),
  asyncHandler(authController.resetPassword),
);
authRouter.get("/me", authenticate, asyncHandler(authController.me));
