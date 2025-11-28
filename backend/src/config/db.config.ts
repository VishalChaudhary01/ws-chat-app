import mongoose from "mongoose";
import { Env } from "./env.config";
import { logger } from "@/utils/logger";

export const connectMongoDB = async () => {
  try {
    await mongoose.connect(Env.MONGODB_URL);
    logger.info("MongoDB connected");
  } catch (error) {
    logger.warn("Failed to connect to mongodb", error);
    process.exit(1);
  }
};
