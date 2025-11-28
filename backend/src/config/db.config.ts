import mongoose from "mongoose";
import { Env } from "./env.config";

export const connectMongoDB = async () => {
  try {
    await mongoose.connect(Env.MONGODB_URL);
    console.log("MongoDB connected");
  } catch (error) {
    console.log("Failed to connect to mongodb", error);
    process.exit(1);
  }
};
