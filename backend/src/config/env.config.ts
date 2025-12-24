import { getEnv } from "../utils/getEnv";

export const Env = {
  NODE_ENV: getEnv("NODE_ENV", "development"),
  PORT: getEnv("PORT"),
  FRONTEND_URL: getEnv("FRONTEND_URL"),
  DATABASE_URL: getEnv("DATABASE_URL"),
  ACCESS_TOKEN_SECRET: getEnv("ACCESS_TOKEN_SECRET"),
  REFRESH_TOKEN_SECRET: getEnv("REFRESH_TOKEN_SECRET"),
  VERIFICATION_TOKEN_SECRET: getEnv("VERIFICATION_TOKEN_SECRET"),
} as const;
