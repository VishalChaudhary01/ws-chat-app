import { prisma } from "@/config/db.config";
import { StatusCode } from "@/config/http.config";
import {
  createChat,
  getChatWithMessage,
  getUserChats,
} from "@/controllers/chat.controller";
import { AppError } from "@/utils/app-error";
import { describe, it, expect, beforeEach } from "@jest/globals";
import { Request, Response } from "express";

jest.mock("@/config/db.config", () => ({
  prisma: {
    chat: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    message: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const mockChat = {
  id: "chat-123",
  isGroup: false,
  groupName: null,
  createdById: "user-123",
  createdAt: "2025-12-13T11:22:27.494Z",
  updatedAt: "2025-12-13T11:22:27.494Z",
};

let mockReq: Partial<Request> & { userId?: string };
let mockRes: Partial<Response>;
let mockJson: jest.Mock;
let mockStatus: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();

  mockJson = jest.fn().mockReturnThis();
  mockStatus = jest.fn().mockReturnThis();

  mockRes = {
    status: mockStatus,
    json: mockJson,
  };
  mockReq = {
    userId: "user-123",
  };

  (prisma.chat.findFirst as jest.Mock).mockResolvedValue(null);
  (prisma.chat.create as jest.Mock).mockResolvedValue({});
  (prisma.chat.findMany as jest.Mock).mockResolvedValue([{}]);
});

describe("CHAT CONTROLLER - CREATE_CHAT", () => {
  beforeEach(() => {
    mockReq = {
      ...mockReq,
      body: {
        isGroup: false,
        participantId: "user-123",
      },
    };
  });

  it("1. should create chat", async () => {
    await createChat(mockReq as Request, mockRes as Response);

    expect(prisma.chat.findFirst as jest.Mock).toHaveBeenCalled();
    expect(prisma.chat.create as jest.Mock).toHaveBeenCalled();

    expect(mockStatus).toHaveBeenCalledWith(StatusCode.CREATED);
    expect(mockJson).toHaveBeenCalled();
  });

  it("2. should not create group for invalid inputs", async () => {
    mockReq = {
      userId: "user-123",
      body: {
        isGroup: true,
      },
    };

    await expect(
      createChat(mockReq as Request, mockRes as Response)
    ).rejects.toThrow(AppError);

    expect(prisma.chat.findFirst as jest.Mock).not.toHaveBeenCalled();
    expect(prisma.chat.create as jest.Mock).not.toHaveBeenCalled();
  });

  it("3. should return existing chat if present", async () => {
    (prisma.chat.findFirst as jest.Mock).mockResolvedValue(mockChat);

    await createChat(mockReq as Request, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(StatusCode.OK);

    expect(prisma.chat.create as jest.Mock).not.toHaveBeenCalled();
  });
});

describe("CHAT CONTROLLER - GET_USER_CHATS", () => {
  it("1. should return user all chats", async () => {
    await getUserChats(mockReq as Request, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(StatusCode.OK);
  });
});

describe("CHAT CONTROLLER - GET_USER_WITH_MESSAGES", () => {
  beforeEach(() => {
    mockReq = {
      ...mockReq,
      params: { id: "chat-123" },
    };
  });

  it("1. should fail if chat not found", async () => {
    await expect(
      getChatWithMessage(mockReq as Request, mockRes as Response)
    ).rejects.toThrow("Chat not found");
  });
});
