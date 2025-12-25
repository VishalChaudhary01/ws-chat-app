import {
  forgotPassword,
  resendCode,
  resetPassword,
  rotateRefreshToken,
  signin,
  signout,
  signup,
  verifyOTP,
} from "@/controllers/auth.controller";
import { inputValidator } from "@/middlewares/input-validator";
import { verifyAuth } from "@/middlewares/verify-auth";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signinSchema,
  signupSchema,
  verifyOTPSchema,
} from "@/validators/auth.validator";
import { Router } from "express";

const authRoutes = Router();

authRoutes.post("/signup", inputValidator(signupSchema), signup);
authRoutes.post("/signin", inputValidator(signinSchema), signin);
authRoutes.post("/verify-otp", inputValidator(verifyOTPSchema), verifyOTP);
authRoutes.post("/resend-otp", resendCode);
authRoutes.post(
  "/forgot-password",
  inputValidator(forgotPasswordSchema),
  forgotPassword
);
authRoutes.post(
  "/reset-password",
  inputValidator(resetPasswordSchema),
  resetPassword
);
authRoutes.post("/signout", verifyAuth, signout);
authRoutes.post("/rotate-token", rotateRefreshToken);

export default authRoutes;
