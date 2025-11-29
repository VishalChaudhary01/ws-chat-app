import { Env } from "@/config/env.config";
import { StatusCode } from "@/config/http.config";
import { AppError } from "@/utils/app-error";
import { TPayload, verifyJwt } from "@/utils/jwt";
import { Request, Response, NextFunction } from "express";

export async function verifyAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authorization = req.headers.authorization;
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(403).json({ message: "Unauthorize user" });
    }

    const token = authorization.split(" ")[1];
    if (!token) {
      return res.status(403).json({ message: "Unauthorize user" });
    }
    const payload = verifyJwt<TPayload>(token, Env.ACCESS_TOKEN_SECRET);
    if (!payload || !payload.userId) {
      throw new AppError("Invalid access token", StatusCode.UNAUTHORIZED);
    }

    req.userId = payload.userId;
    next();
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError("Authentication failed", StatusCode.UNAUTHORIZED)
    );
  }
}
