import express, { NextFunction, Request, Response } from "express";
import { Env } from "@/config/env.config";
import { connectMongoDB } from "./config/db.config";
import { logger } from "./utils/logger";
import { errorHandler } from "./middlewares/error-handler";
import { AppError } from "./utils/app-error";
import { StatusCode } from "./config/http.config";

const app = express();
const PORT = Env.PORT;

app.get("/health", (_req, res) => {
  res.status(200).json({ message: "Healthy server" });
});

app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`API route ${req.path} not found`, StatusCode.NOT_FOUND));
});

app.use(errorHandler);

app.listen(PORT, async () => {
  await connectMongoDB();
  logger.info(`Server running at http://localhost:${PORT}`);
});
