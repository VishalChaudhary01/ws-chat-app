import express from "express";
import { Env } from "@/config/env.config";
import { connectMongoDB } from "./config/db.config";
import { logger } from "./utils/logger";

const app = express();
const PORT = Env.PORT;

app.get("/health", (_req, res) => {
  res.status(200).json({ message: "Healthy server" });
});

app.listen(PORT, async () => {
  await connectMongoDB();
  logger.info(`Server running at http://localhost:${PORT}`);
});
