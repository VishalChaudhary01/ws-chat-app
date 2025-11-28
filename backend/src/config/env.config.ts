import { getEnv } from "../utils/getEnv";

export const Env = {
  NODE_ENV: getEnv("NODE_ENV", "development"),
  PORT: getEnv("PORT"),
  MONGODB_URL: getEnv("MONGODB_URL"),
} as const;
