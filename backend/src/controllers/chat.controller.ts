import { prisma } from "@/config/db.config";
import { StatusCode } from "@/config/http.config";
import { AppError } from "@/utils/app-error";
import { CreateChatInput } from "@/validators/chat.validator";
import { Request, Response } from "express";
import { wsServer } from "..";

export async function createChat(req: Request, res: Response) {
  const inputs: CreateChatInput = req.body;
  const userId = req.userId;
  if (!userId) {
    throw new AppError("Unauthorize user", StatusCode.UNAUTHORIZED);
  }

  const { isGroup, participantId, groupName, participantIds } = inputs;

  let chat;

  if (!isGroup) {
    if (!participantId) {
      throw new AppError("Participant_Id is required", StatusCode.BAD_REQUEST);
    }

    const existingChat = await prisma.chat.findFirst({
      where: {
        isGroup: false,
        participants: {
          every: {
            id: { in: [userId, participantId] },
          },
        },
      },
    });

    if (existingChat) {
      return res
        .status(StatusCode.OK)
        .json({ message: "Existing chat fetched", chat: existingChat });
    }

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

  if (isGroup) {
    if (!groupName || !participantIds) {
      throw new AppError(
        "Group chat requires groupName and participants",
        StatusCode.BAD_REQUEST
      );
    }

    const uniqueParticipantIds = Array.from(
      new Set([userId, ...participantIds])
    );

    chat = await prisma.chat.create({
      data: {
        isGroup: true,
        groupName,
        createdById: userId,
        participants: {
          connect: uniqueParticipantIds.map((id) => ({ id })),
        },
      },
    });
  }

  res
    .status(StatusCode.CREATED)
    .json({ message: "Chat created successfully", chat });
}

export async function getUserChats(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    throw new AppError("Unauthorize user", StatusCode.UNAUTHORIZED);
  }

  const chats = await prisma.chat.findMany({
    where: {
      participants: {
        some: {
          id: userId,
        },
      },
    },
    include: {
      participants: {
        where: {
          id: { not: userId },
        },
        select: {
          id: true,
          name: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Subscribe chat rooms for real-time updates
  const chatIds = chats.map((chat) => chat.id);
  wsServer.subscribeUserToRooms(userId, chatIds);

  res
    .status(StatusCode.OK)
    .json({ message: "Chats fetched successfully", chats });
}

export async function getChatWithMessage(req: Request, res: Response) {
  const chatId = req.params.id;
  const userId = req.userId;

  if (!userId) {
    throw new AppError("Unauthorized user", StatusCode.UNAUTHORIZED);
  }

  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      participants: {
        some: { id: userId },
      },
    },
    include: {
      participants: {
        select: {
          id: true,
          name: true,
        },
      },
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          sender: {
            select: { id: true, name: true },
          },
          replyTo: {
            select: { id: true, content: true, replyToId: true },
          },
        },
      },
    },
  });
  if (!chat) {
    throw new AppError("Chat not found", StatusCode.NOT_FOUND);
  }

  res.status(StatusCode.OK).json({
    message: "Chat with messages fetched successfully",
    chat,
  });
}
