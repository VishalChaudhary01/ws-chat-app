import { z } from "zod";

// Name schema
export const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .min(2, { message: "Name must be at least 2 characters" })
  .max(100, { message: "Name must be under 100 characters" });

// Email schema
export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Please enter a valid email address");

// Password schema
export const passwordSchema = z
  .string()
  .trim()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[@$!%*?&#]/, "Password must contain at least one special character");

// OTP code Schema
export const otpSchema = z
  .string()
  .trim()
  .min(1, "OTP is required")
  .regex(/^\d{6}$/, "OTP must be a 6-digit number");

export const idSchema = z.string().min(1, "Id is required");
