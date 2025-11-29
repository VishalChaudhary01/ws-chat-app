import { RequestHandler } from "express";
import { ZodObject } from "zod";

export function inputValidator(schema: ZodObject): RequestHandler {
  return (req, _res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}
