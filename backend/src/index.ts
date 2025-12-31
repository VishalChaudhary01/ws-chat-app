import express, { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { Env } from "@/config/env.config";
import { logger } from "./utils/logger";
import { errorHandler } from "./middlewares/error-handler";
import { AppError } from "./utils/app-error";
import { StatusCode } from "./config/http.config";
import appRoutes from "./routes";
import { WebSocketServer } from "./services/websocket-service";
import { createServer } from "http";

export const app = express();
const PORT = Env.PORT;

const httpServer = createServer(app);

app.use(cors({ origin: Env.FRONTEND_URL, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ message: "Healthy server" });
});

app.use("/api/v1", appRoutes);

export const wsServer = new WebSocketServer(httpServer);

app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`API route ${req.path} not found`, StatusCode.NOT_FOUND));
});

app.use(errorHandler);

httpServer.listen(PORT, () =>
  logger.info(`Server running at http://localhost:${PORT}`)
);
