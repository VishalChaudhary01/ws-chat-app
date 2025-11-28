import { Env } from "@/config/env.config";
import { StatusCode } from "@/config/http.config";
import { AppError } from "@/utils/app-error";
import { logger } from "@/utils/logger";
import { NextFunction, Request, Response } from "express";

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.warn(`Error occured at PATH: ${req.path}`, error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
    message:
      Env.NODE_ENV === "development"
        ? error.message ??
          "We are sorry for the inconvenience. Something went wrong on the server. Please try again later."
        : "Unexpected error occure",
  });
}
