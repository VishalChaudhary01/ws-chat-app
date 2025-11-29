import express, { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { Env } from "@/config/env.config";
import { logger } from "./utils/logger";
import { errorHandler } from "./middlewares/error-handler";
import { AppError } from "./utils/app-error";
import { StatusCode } from "./config/http.config";
import appRoutes from "./routes";

const app = express();
app.use(
  cors({
    origin: "*",
  })
);
app.use(cookieParser());
app.use(express.json());
const PORT = Env.PORT;

app.get("/health", (_req, res) => {
  res.status(200).json({ message: "Healthy server" });
});

app.use("/api/v1", appRoutes);

app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`API route ${req.path} not found`, StatusCode.NOT_FOUND));
});

app.use(errorHandler);

app.listen(PORT, () =>
  logger.info(`Server running at http://localhost:${PORT}`)
);
