import { Prisma } from "@/@generated/client";
import { Env } from "@/config/env.config";
import { StatusCode } from "@/config/http.config";
import { AppError } from "@/utils/app-error";
import { logger } from "@/utils/logger";
import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

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

  if (error instanceof ZodError) {
    const message = error.issues.map((issue) => `${issue.message}`).join(", ");
    return res.status(StatusCode.BAD_REQUEST).json({ message });
  }

  //  Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return res
      .status(StatusCode.BAD_REQUEST)
      .json({ message: "Invalid data provided to the database." });
  }

  return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
    message:
      Env.NODE_ENV === "development"
        ? error.message ??
          "We are sorry for the inconvenience. Something went wrong on the server. Please try again later."
        : "Unexpected error occure",
  });
}
