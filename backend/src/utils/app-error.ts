import { HTTPStatusCode, StatusCode } from "@/config/http.config";

export class AppError extends Error {
  public statusCode: HTTPStatusCode;

  constructor(
    message: string,
    statusCode: HTTPStatusCode = StatusCode.INTERNAL_SERVER_ERROR
  ) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
