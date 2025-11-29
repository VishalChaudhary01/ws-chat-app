import { VerificationType } from "@/@generated/enums";
import { Env } from "@/config/env.config";
import jwt, { JwtPayload } from "jsonwebtoken";

type Unit = "m" | "h" | "d";
export type StringValue = `${number}${Unit}`;

export interface TPayload extends JwtPayload {
  userId: string;
}

export type VerificationStage =
  | "code_sent"
  | "code_verification"
  | "password_reset"
  | "completed";

export interface VerificationTPayload extends TPayload {
  verificationType: VerificationType;
  stage?: VerificationStage;
  codeVerified?: boolean;
}

export function signJwt(
  payload: TPayload,
  secret: string = Env.ACCESS_TOKEN_SECRET,
  expiresIn: StringValue = "15m"
): string {
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyJwt<T extends object = JwtPayload>(
  token: string,
  secret: string
): T | null {
  try {
    return jwt.verify(token, secret) as T;
  } catch (error) {
    return null;
  }
}
