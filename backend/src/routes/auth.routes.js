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
import { validate } from "../utils/validators.js";

export const authRouter = Router();

authRouter.post("/register", validate(registerSchema), authController.register);
authRouter.post(
  "/verify-email",
  validate(codeSchema),
  authController.verifyEmail,
);
authRouter.post(
  "/resend-code",
  validate(emailSchema),
  authController.resendCode,
);
authRouter.post("/login", validate(loginSchema), authController.login);
authRouter.post(
  "/forgot-password",
  validate(emailSchema),
  authController.forgotPassword,
);
authRouter.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword,
);
authRouter.get("/me", authenticate, authController.me);
