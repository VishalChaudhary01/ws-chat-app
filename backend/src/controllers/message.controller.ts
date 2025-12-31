import { prisma } from "@/config/db.config";
import { StatusCode } from "@/config/http.config";
import { AppError } from "@/utils/app-error";
import { SendMessageInput } from "@/validators/message.validator";
import { Request, Response } from "express";
import { wsServer } from "..";

export async function sendMessage(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    throw new AppError("Unauthorized user", StatusCode.UNAUTHORIZED);
  }

  const inputs: SendMessageInput = req.body;

  const { chatId, participantId, content, replyToId } = inputs;

  let resolvedChatId: string;

  if (chatId) {
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, participants: { some: { id: userId } } },
    });
    if (!chat) {
      throw new AppError("Unauthorized user", StatusCode.UNAUTHORIZED);
    }

    resolvedChatId = chat.id;
  } else if (participantId) {
    if (participantId === userId) {
      throw new AppError(
        "Cannot send message to yourself",
        StatusCode.BAD_REQUEST
      );
    }

    let chat = await prisma.chat.findFirst({
      where: {
        isGroup: false,
        participants: {
          every: {
            id: { in: [userId, participantId] },
          },
        },
      },
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          isGroup: false,
          createdById: userId,
          participants: {
            connect: [{ id: userId }, { id: participantId }],
          },
        },
      });
    }

    resolvedChatId = chat.id;
  } else {
    throw new AppError(
      "chatId or participantId is required",
      StatusCode.BAD_REQUEST
    );
  }

  if (replyToId) {
    const replyMessage = await prisma.message.findFirst({
      where: {
        id: replyToId,
        chatId: resolvedChatId,
      },
    });

    if (!replyMessage) {
      throw new AppError("Reply message not found", StatusCode.NOT_FOUND);
    }
  }

  const message = await prisma.message.create({
    data: {
      chatId: resolvedChatId,
      senderId: userId,
      content,
      replyToId: replyToId ?? null,
    },
  });

  // emit message to all participants
  wsServer.emitToRoom(resolvedChatId, {
    type: "new_message",
    message,
  });

  res
    .status(StatusCode.OK)
    .json({ message: "Message send successfully", chatId: message.chatId });
}
