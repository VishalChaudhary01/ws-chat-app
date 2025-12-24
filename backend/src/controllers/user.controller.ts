import { prisma } from "@/config/db.config";
import { StatusCode } from "@/config/http.config";
import { AppError } from "@/utils/app-error";
import { Request, Response } from "express";

export async function getProfile(req: Request, res: Response) {
  const id = req.userId;
  if (!id) {
    throw new AppError("Unauthorize user", StatusCode.UNAUTHORIZED);
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  });
  if (!user) {
    throw new AppError("User not found", StatusCode.NOT_FOUND);
  }

  res.status(StatusCode.OK).json({
    message: "Profile fetched successfully",
    user,
  });
}

export async function getUsers(req: Request, res: Response) {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
  });

  res.status(StatusCode.OK).json({
    message: "All users fetched successfully",
    users,
  });
}
