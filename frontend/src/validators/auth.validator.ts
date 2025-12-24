import z from "zod";
import { emailSchema, nameSchema, otpSchema, passwordSchema } from ".";

export const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const signinSchema = z.object({
  email: emailSchema,
  password: z.string("Password is required").min(1, "Password is required"),
});

export const verifyOTPSchema = z.object({
  otp: otpSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: passwordSchema,
});

export type SignupDTO = z.infer<typeof signupSchema>;
export type SigninDTO = z.infer<typeof signinSchema>;
export type VerifyOTPDTO = z.infer<typeof verifyOTPSchema>;
export type ForgotPasswordDTO = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>;
