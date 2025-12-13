import { prisma } from "@/config/db.config";
import { StatusCode } from "@/config/http.config";
import { sendMessage } from "@/controllers/message.controller";
import { describe, it, expect, beforeEach } from "@jest/globals";
import { Request, Response } from "express";

jest.mock("@/config/db.config", () => ({
  prisma: {
    chat: {
      findFirst: jest.fn(),
    },
    message: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

let mockReq: Partial<Request> & { userId?: string };
let mockRes: Partial<Response>;
let mockJson: jest.Mock;
let mockStatus: jest.Mock;

const mockChat = {
  id: "chat-123",
  isGroup: false,
  groupName: null,
  createdById: "user-123",
  createdAt: "2025-12-13T11:22:27.494Z",
  updatedAt: "2025-12-13T11:22:27.494Z",
};

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
    body: { chatId: "chat-123", content: "Happy Testing" },
  };

  (prisma.chat.findFirst as jest.Mock).mockResolvedValue(mockChat);
  (prisma.message.create as jest.Mock).mockResolvedValue({});
  (prisma.message.findFirst as jest.Mock).mockResolvedValue({});
});

describe("MESSAGE CONTROLLER - SEND_MESSAGE", () => {
  it("1. should send message", async () => {
    await sendMessage(mockReq as Request, mockRes as Response);

    expect(prisma.chat.findFirst as jest.Mock).toHaveBeenCalled();
    expect(prisma.message.create as jest.Mock).toHaveBeenCalled();
    expect(prisma.message.findFirst as jest.Mock).not.toHaveBeenCalled();

    expect(mockStatus).toHaveBeenCalledWith(StatusCode.OK);
    expect(mockJson).toHaveBeenCalledWith({
      message: "Message send successfully",
    });
  });

  it("2. should fail if user not member of chat", async () => {
    (prisma.chat.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      sendMessage(mockReq as Request, mockRes as Response)
    ).rejects.toThrow("Unauthorized user");
  });

  it("3. should fail if reply_to message not found", async () => {
    mockReq = {
      userId: "user-123",
      body: {
        chatId: "chat-123",
        content: "Happy Testing",
        replyToId: "replyTo-123",
      },
    };
    (prisma.message.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      sendMessage(mockReq as Request, mockRes as Response)
    ).rejects.toThrow("ReplyTo message not found");
  });
});
