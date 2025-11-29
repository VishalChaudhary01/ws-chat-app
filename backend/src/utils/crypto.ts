import crypto from "crypto";
import bcrypt from "bcryptjs";

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
export function generateOTP() {
  const OTP = crypto.randomInt(100000, 1000000).toString();
  const hashedOTP = bcrypt.hashSync(OTP, 12);
  return { OTP, hashedOTP };
}

export function generateRefreshToken() {
  const refreshToken = crypto.randomBytes(32).toString("hex");
  const hashedRefreshToken = hashToken(refreshToken);
  return { refreshToken, hashedRefreshToken };
}
