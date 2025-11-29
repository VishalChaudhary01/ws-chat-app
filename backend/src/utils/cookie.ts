import { Env } from "@/config/env.config";
import { Request, Response, CookieOptions } from "express";

export type CookieName = "refresh_token" | "verification_token";

const defaultOptions: CookieOptions = {
  httpOnly: true,
  secure: Env.NODE_ENV === "production",
  sameSite: Env.NODE_ENV === "production" ? "none" : "lax",
};

export function setCookie(
  res: Response,
  name: CookieName,
  value: string,
  age: number = 15,
  path: string = "/"
) {
  return res.cookie(name, value, {
    ...defaultOptions,
    path: path,
    maxAge: age * 60 * 10000,
  });
}

export function getCookie(req: Request, name: CookieName) {
  return req.cookies[name];
}

export function clearCookie(res: Response, name: CookieName) {
  return res.clearCookie(name);
}
