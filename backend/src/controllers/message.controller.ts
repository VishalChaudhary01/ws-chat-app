import { prisma } from "@/config/db.config";
import { StatusCode } from "@/config/http.config";
import { AppError } from "@/utils/app-error";
import { SendMessageInput } from "@/validators/message.validator";
import { Request, Response } from "express";

export async function sendMessage(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    throw new AppError("Unauthorized user", StatusCode.UNAUTHORIZED);
  }

  const inputs: SendMessageInput = req.body;

  const { chatId, content, replyToId } = inputs;

  const chat = await prisma.chat.findFirst({
    where: { id: chatId, participants: { some: { id: userId } } },
  });
  if (!chat) {
    throw new AppError("Unauthorized user", StatusCode.UNAUTHORIZED);
  }

  if (replyToId) {
    const replyMessage = await prisma.message.findFirst({
      where: { id: replyToId, chatId },
    });
    if (!replyMessage) {
      throw new AppError("ReplyTo message not found", StatusCode.NOT_FOUND);
    }
  }

  await prisma.message.create({
    data: {
      chatId,
      senderId: userId,
      content: content,
      replyToId: replyToId ?? null,
    },
  });

  //   TODO SOCKET ---> emit message to all participants

  res.status(StatusCode.OK).json({ message: "Message send successfully" });
}
