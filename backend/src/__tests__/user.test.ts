import { prisma } from "@/config/db.config";
import { StatusCode } from "@/config/http.config";
import { getProfile, getUsers } from "@/controllers/user.controller";
import { describe, it, expect, beforeEach } from "@jest/globals";
import { Request, Response } from "express";

jest.mock("@/config/db.config", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const mockUser = {
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
  password: "hashed_password",
  emailVerified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
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
  mockReq = { userId: "user-123" };

  (prisma.user.findUnique as jest.Mock).mockReturnValue(mockUser);
  (prisma.user.findMany as jest.Mock).mockReturnValue(mockUser);
});

describe("USER CONTROLLER - GET_PROFILE", () => {
  it("1. should return uesr profile", async () => {
    await getProfile(mockReq as Request, mockRes as Response);

    expect(prisma.user.findUnique as jest.Mock).toHaveBeenCalledWith({
      where: { id: "user-123" },
    });

    expect(mockStatus).toHaveBeenCalledWith(StatusCode.OK);
  });
  it("2. should fail for unauthorize user", async () => {
    mockReq = { userId: "" };

    await expect(
      getProfile(mockReq as Request, mockRes as Response)
    ).rejects.toThrow("Unauthorize user");
  });
});

describe("USER CONTROLLER - FETCH_USERS", () => {
  it("1. should fetch all users", async () => {
    await getUsers(mockReq as Request, mockRes as Response);

    expect(prisma.user.findMany as jest.Mock).toHaveBeenCalled();

    expect(mockStatus).toHaveBeenCalledWith(StatusCode.OK);
  });
});
