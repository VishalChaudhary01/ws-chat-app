import { VerificationType } from "@/@generated/enums";
import { prisma } from "@/config/db.config";
import { StatusCode } from "@/config/http.config";
import {
  forgotPassword,
  resendCode,
  resetPassword,
  rotateRefreshToken,
  signin,
  signout,
  signup,
  verifyOTP,
} from "@/controllers/auth.controller";
import { AppError } from "@/utils/app-error";
import { clearCookie, getCookie, setCookie } from "@/utils/cookie";
import { generateOTP, generateRefreshToken, hashToken } from "@/utils/crypto";
import { signJwt, verifyJwt } from "@/utils/jwt";
import { describe, it, expect, beforeEach } from "@jest/globals";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";

jest.mock("@/config/db.config", () => ({
  prisma: {
    $transaction: jest.fn(),
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    verificationCode: {
      findFirst: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    refreshToken: {
      findFirst: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock("bcryptjs");
jest.mock("@/utils/crypto");
jest.mock("@/utils/jwt");
jest.mock("@/utils/cookie");

let mockReq: Partial<Request> & { userId?: string };
let mockRes: Partial<Response>;
let mockJson: jest.Mock;
let mockStatus: jest.Mock;

const mockUser = {
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
  password: "hashed_password",
  emailVerified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockVerificationCode = {
  userId: "user-123",
  type: VerificationType.CONFIRM_EMAIL,
  id: "verification-123",
  code: "hashed_otp",
  createdAt: new Date(Date.now() - 65 * 1000),
  expiresAt: new Date(Date.now() + 15 * 60 * 1000),
};

beforeEach(() => {
  jest.clearAllMocks();

  mockJson = jest.fn().mockReturnThis();
  mockStatus = jest.fn().mockReturnThis();

  mockRes = {
    status: mockStatus,
    json: mockJson,
  };

  (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  (bcrypt.hash as jest.Mock).mockResolvedValue("hashed_password");

  (generateOTP as jest.Mock).mockReturnValue({
    OTP: "123456",
    hashedOTP: "hashed_otp",
  });

  (signJwt as jest.Mock).mockReturnValue("signed_token_value");

  (setCookie as jest.Mock).mockImplementation(() => {});
  (clearCookie as jest.Mock).mockImplementation(() => {});
  (getCookie as jest.Mock).mockReturnValue("verification_token_value");

  (generateRefreshToken as jest.Mock).mockReturnValue({
    refreshToken: "refresh_token_value",
    hashedRefreshToken: "hashed_refresh_token_value",
  });

  (hashToken as jest.Mock).mockReturnValue("hashed_token");

  (prisma.user.findUnique as jest.Mock).mockReturnValue(mockUser);
  (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
  (prisma.user.update as jest.Mock).mockResolvedValue({});

  (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});
  (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({});

  (prisma.verificationCode.findFirst as jest.Mock).mockReturnValue(
    mockVerificationCode
  );
  (prisma.verificationCode.deleteMany as jest.Mock).mockResolvedValue({});
});

describe("AUTH CONTROLLER - SIGNUP", () => {
  const validInput = {
    name: "Test User",
    email: "test@example.com",
    password: "Test@1234",
  };

  beforeEach(() => {
    mockReq = { body: { ...validInput } };
  });

  it("1. should successfully register new user", async () => {
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      return callback({
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue(mockUser),
        },
        verificationCode: {
          create: jest.fn().mockResolvedValue({
            id: "code-123",
            userId: mockUser.id,
            code: "hashed_otp",
          }),
        },
        refreshToken: { deleteMany: jest.fn() },
      });
    });

    await signup(mockReq as Request, mockRes as Response);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(bcrypt.hash).toHaveBeenCalledWith(validInput.password, 12);
    expect(generateOTP).toHaveBeenCalledTimes(1);
    expect(signJwt).toHaveBeenLastCalledWith(
      {
        userId: mockUser.id,
        verificationType: VerificationType.CONFIRM_EMAIL,
      },
      expect.any(String)
    );

    expect(setCookie).toHaveBeenCalled();

    expect(mockStatus).toHaveBeenCalledWith(StatusCode.CREATED);
    expect(mockJson).toHaveBeenCalledWith({
      message:
        "User registered successfully. Please check your email for verification code.",
    });
  });

  it("2. should fail when user already exist and verified", async () => {
    const verifiedUser = {
      ...mockUser,
      emailVerified: true,
    };

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      return callback({
        user: { findUnique: jest.fn().mockResolvedValue(verifiedUser) },
      });
    });

    await expect(
      signup(mockReq as Request, mockRes as Response)
    ).rejects.toThrow(AppError);
  });

  it("3. should delete existing unverified user and create new one", async () => {
    const unverifiedUser = {
      ...mockUser,
      id: "old-user-123",
      emailVerified: false,
    };

    const delUser = jest.fn();
    const delCodes = jest.fn();
    const delTokens = jest.fn();
    const createUser = jest.fn().mockResolvedValue(mockUser);

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      return callback({
        user: {
          findUnique: jest.fn().mockResolvedValue(unverifiedUser),
          delete: delUser,
          create: createUser,
        },
        verificationCode: { deleteMany: delCodes, create: jest.fn() },
        refreshToken: { deleteMany: delTokens },
      });
    });

    await signup(mockReq as Request, mockRes as Response);

    expect(delTokens).toHaveBeenCalledWith({
      where: { userId: unverifiedUser.id },
    });
    expect(delCodes).toHaveBeenCalledWith({
      where: { userId: unverifiedUser.id },
    });
    expect(delUser).toHaveBeenCalledWith({ where: { id: unverifiedUser.id } });

    expect(createUser).toHaveBeenCalled();
  });
});

describe("AUTH CONTROLLER - VERIFY OTP", () => {
  let payload: any;

  beforeEach(() => {
    mockReq = { body: { otp: "123456" } };

    payload = {
      userId: "user-123",
      verificationType: VerificationType.CONFIRM_EMAIL,
    };

    (verifyJwt as jest.Mock).mockReturnValue(payload);
  });

  it("1. should verify email and generate refresh token", async () => {
    await verifyOTP(mockReq as Request, mockRes as Response);

    expect(getCookie).toHaveBeenCalledWith(
      mockReq as Request,
      "verification_token"
    );
    expect(verifyJwt).toHaveBeenCalledWith(
      "verification_token_value",
      expect.any(String)
    );

    expect(prisma.verificationCode.findFirst).toHaveBeenCalledWith({
      where: { userId: "user-123", type: expect.any(String) },
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-123" },
      data: { emailVerified: true },
    });

    expect(prisma.refreshToken.create).toHaveBeenCalled();

    expect(mockStatus).toHaveBeenCalledWith(StatusCode.OK);
    expect(mockJson).toHaveBeenCalledWith({
      message: "Email verified successfully",
      verified: true,
      accessToken: expect.any(String),
    });
  });

  it("2. should fail when cookie missing", async () => {
    (getCookie as jest.Mock).mockReturnValue(null);

    await expect(
      verifyOTP(mockReq as Request, mockRes as Response)
    ).rejects.toThrow(AppError);
  });

  it("3. should fail when JWT invalid", async () => {
    (verifyJwt as jest.Mock).mockReturnValue(null);

    await expect(
      verifyOTP(mockReq as Request, mockRes as Response)
    ).rejects.toThrow(AppError);
  });

  it("4. should fail when verification code expired", async () => {
    (prisma.verificationCode.findFirst as jest.Mock).mockResolvedValue({
      ...mockVerificationCode,
      expiresAt: new Date(Date.now() - 10000),
    });

    await expect(
      verifyOTP(mockReq as Request, mockRes as Response)
    ).rejects.toThrow("Verification session expired");
  });

  it("5. should fail on invalid OTP", async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      verifyOTP(mockReq as Request, mockRes as Response)
    ).rejects.toThrow("Invalid verification OTP");
  });

  it("6. should handle PASSWORD_RESET stage logic", async () => {
    payload.verificationType = VerificationType.PASSWORD_RESET;
    payload.stage = "code_verification";
    (verifyJwt as jest.Mock).mockResolvedValue(payload);

    await verifyOTP(mockReq as Request, mockRes as Response);

    expect(setCookie).toHaveBeenCalled();
    expect(mockJson).toHaveBeenCalledWith({
      message: "Email verified successfully",
      accessToken: expect.any(String),
      verified: true,
    });
  });

  it("7. should reject PASSWORD_RESET when stage is incorrect", async () => {
    payload.verificationType = VerificationType.PASSWORD_RESET;
    payload.stage = "wrong_stage";

    (verifyJwt as jest.Mock).mockReturnValue(payload);

    await expect(
      verifyOTP(mockReq as Request, mockRes as Response)
    ).rejects.toThrow("Invalid operation for current stage");
  });
});

describe("AUTH CONTROLLER - RESEND CODE", () => {
  beforeEach(() => {
    mockReq = {};
    (verifyJwt as jest.Mock).mockReturnValue({
      userId: "user-123",
      verificationType: VerificationType.CONFIRM_EMAIL,
    });
  });

  it("1. should resend OTP", async () => {
    await resendCode(mockReq as Request, mockRes as Response);

    expect(getCookie).toHaveBeenCalled();
    expect(verifyJwt).toHaveBeenCalled();
    expect(generateOTP).toHaveBeenCalled();

    expect(mockStatus).toHaveBeenCalledWith(StatusCode.OK);
    expect(mockJson).toHaveBeenCalledWith({
      message: "New verification code sent",
    });
  });

  it("2. should fail if no verification token found", async () => {
    (getCookie as jest.Mock).mockReturnValue(null);

    await expect(
      resendCode(mockReq as Request, mockRes as Response)
    ).rejects.toThrow("No active code verification session");
  });

  it("3. should fail if rate limit exceeded", async () => {
    (prisma.verificationCode.findFirst as jest.Mock).mockResolvedValue({
      ...mockVerificationCode,
      createdAt: new Date(Date.now() - 30 * 1000),
    });

    await expect(
      resendCode(mockReq as Request, mockRes as Response)
    ).rejects.toThrow("Too many requests");
  });

  it("4. should handle PASSWORD_RESET resend correctly", async () => {
    (verifyJwt as jest.Mock).mockReturnValue({
      userId: "user-123",
      verificationType: VerificationType.PASSWORD_RESET,
      stage: "code_verification",
    });

    await resendCode(mockReq as Request, mockRes as Response);

    expect(mockJson).toHaveBeenCalledWith({
      message: "New verification code sent",
      stage: "code_verification",
    });
  });
});

describe("AUTH CONTROLLER - FORGOT PASSWORD", () => {
  beforeEach(() => {
    mockReq = { body: { email: "test@gmail.com" } };

    (prisma.user.findFirst as jest.Mock).mockResolvedValue({
      ...mockUser,
      emailVerified: true,
    });
  });

  it("1. should send password reset code for valid user", async () => {
    await forgotPassword(mockReq as Request, mockRes as Response);

    expect(generateOTP).toHaveBeenCalled();
    expect(setCookie).toHaveBeenCalled();

    expect(mockStatus).toHaveBeenCalledWith(StatusCode.OK);
    expect(mockJson).toHaveBeenCalledWith({
      message:
        "If an account exists with this email, you will receive a password reset code.",
      stage: "code_sent",
    });
  });

  it("2. should send generic response even if fail", async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

    await forgotPassword(mockReq as Request, mockRes as Response);

    expect(bcrypt.hash).toHaveBeenCalledWith("dummy", 12);

    expect(mockStatus).toHaveBeenCalledWith(StatusCode.OK);
    expect(generateOTP).not.toHaveBeenCalled();

    expect(mockJson).toHaveBeenCalledWith({
      message:
        "If an account exists with this email, you will receive a password reset code.",
      stage: "code_sent",
    });
  });
});

describe("AUTH CONTROLLER - RESET PASSWORD", () => {
  beforeEach(() => {
    mockReq = { body: { password: "123456" } };

    (verifyJwt as jest.Mock).mockReturnValue({
      userId: "user-123",
      verificationType: VerificationType.PASSWORD_RESET,
      codeVerified: true,
      stage: "password_reset",
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      ...mockUser,
      emailVerified: true,
    });

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      return callback({
        user: { update: jest.fn() },
        verificationCode: { deleteMany: jest.fn() },
        refreshToken: { deleteMany: jest.fn() },
      });
    });
  });

  it("1. should reset password", async () => {
    await resetPassword(mockReq as Request, mockRes as Response);

    expect(bcrypt.hash).toHaveBeenCalled();
    expect(clearCookie).toHaveBeenCalled();

    expect(mockStatus).toHaveBeenCalledWith(StatusCode.OK);
    expect(mockJson).toHaveBeenCalledWith({
      message:
        "Password reset successfully. Please login with your new password.",
      stage: "completed",
    });
  });

  it("2. should fail if no verification_token cookie found", async () => {
    (getCookie as jest.Mock).mockResolvedValue(null);

    await expect(
      resetPassword(mockReq as Request, mockRes as Response)
    ).rejects.toThrow("Password reset session expired");
  });

  it("3. should fail if otp not verified", async () => {
    (verifyJwt as jest.Mock).mockResolvedValue({
      userId: "user-123",
      verificationType: VerificationType.PASSWORD_RESET,
      codeVerified: false,
      stage: "password_reset",
    });

    await expect(
      resetPassword(mockReq as Request, mockRes as Response)
    ).rejects.toThrow(AppError);
  });

  it("4. should fail for wrong stage", async () => {
    (verifyJwt as jest.Mock).mockResolvedValue({
      verificationType: VerificationType.PASSWORD_RESET,
      codeVerified: true,
      userId: "user-123",
      stage: "wrong_stage",
    });

    await expect(
      resetPassword(mockReq as Request, mockRes as Response)
    ).rejects.toThrow(AppError);

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});

describe("AUTH CONTROLLER - SIGNIN", () => {
  beforeEach(() => {
    mockReq = {
      body: {
        email: "test@example.com",
        password: "Test@1234",
      },
    };

    (prisma.user.findFirst as jest.Mock).mockResolvedValue({
      ...mockUser,
      emailVerified: true,
    });

    (prisma.refreshToken.count as jest.Mock).mockResolvedValue(2);
  });

  it("1. should signin user", async () => {
    await signin(mockReq as Request, mockRes as Response);

    expect(bcrypt.compare).toHaveBeenCalled();
    expect(signJwt).toHaveBeenCalled();
    expect(setCookie).toHaveBeenCalled();

    expect(mockStatus).toHaveBeenCalledWith(StatusCode.OK);
    expect(mockJson).toHaveBeenCalledWith({
      message: "Logged in successfully",
      accessToken: expect.any(String),
    });
  });

  it("2. should fail for invalid credentials", async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      signin(mockReq as Request, mockRes as Response)
    ).rejects.toThrow("Invalid credentials");
  });

  it("3. should delete oldest token when user has more then 3 active sessions", async () => {
    const oldestToken = { id: "oldest_token_id" };
    (prisma.refreshToken.count as jest.Mock).mockResolvedValue(4);
    (prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue(oldestToken);

    await signin(mockReq as Request, mockRes as Response);

    expect(prisma.refreshToken.delete as jest.Mock).toHaveBeenCalledWith({
      where: { id: oldestToken.id },
    });
  });
});

describe("AUTH CONTROLLER - SIGNOUT", () => {
  beforeEach(() => {
    mockReq = {};
    (getCookie as jest.Mock).mockReturnValue("refresh_token_value");
  });

  it("1. should signout user", async () => {
    await signout(mockReq as Request, mockRes as Response);

    expect(getCookie).toHaveBeenCalledWith(mockReq as Request, "refresh_token");
    expect(hashToken).toHaveBeenCalled();
    expect(clearCookie).toHaveBeenCalledWith(
      mockRes as Response,
      "refresh_token"
    );
    expect(mockStatus).toHaveBeenCalledWith(StatusCode.OK);
    expect(mockJson).toHaveBeenCalledWith({
      message: "Logged out successfully",
    });
  });
});

describe("AUTH CONTROLLER - ROTATE REFRESH TOKEN", () => {
  const mockRefreshToken = {
    id: "token-123",
    userId: "user-123",
    token: "hashed_token",
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: true,
  };

  beforeEach(() => {
    mockReq = { userId: "user-123" };
    (getCookie as jest.Mock).mockReturnValue("refresh_token_value");
    (prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue(
      mockRefreshToken
    );
  });

  it("1. should rotate refresh token", async () => {
    await rotateRefreshToken(mockReq as Request, mockRes as Response);

    expect(getCookie).toHaveBeenCalled();
    expect(hashToken).toHaveBeenCalled();
    expect(signJwt).toHaveBeenCalled();
    expect(clearCookie).toHaveBeenCalled();
    expect(setCookie).toHaveBeenCalled();

    expect(mockStatus).toHaveBeenCalledWith(StatusCode.OK);
    expect(mockJson).toHaveBeenCalledWith({
      message: "Access Token re-generated",
      accessToken: expect.any(String),
    });
  });

  it("2. should fail when refresh token is missing", async () => {
    (getCookie as jest.Mock).mockReturnValue(null);

    await expect(
      rotateRefreshToken(mockReq as Request, mockRes as Response)
    ).rejects.toThrow("Unauthorized");
  });

  it("3. should fail when userId is missing", async () => {
    mockReq.userId = undefined;

    await expect(
      rotateRefreshToken(mockReq as Request, mockRes as Response)
    ).rejects.toThrow("Unauthorized");
  });

  it("4. should fail when refresh token is not found", async () => {
    const mockPrisma = prisma as any;
    mockPrisma.refreshToken.findFirst.mockResolvedValue(null);

    await expect(
      rotateRefreshToken(mockReq as Request, mockRes as Response)
    ).rejects.toThrow("Invalid or expired refresh_token");
  });

  it("5. should fail when refresh token is expired", async () => {
    const mockPrisma = prisma as any;
    mockPrisma.refreshToken.findFirst.mockResolvedValue({
      ...mockRefreshToken,
      expiresAt: new Date(Date.now() - 10000),
    });

    await expect(
      rotateRefreshToken(mockReq as Request, mockRes as Response)
    ).rejects.toThrow("Invalid or expired refresh_token");
  });

  it("should revoke all tokens when token theft is detected (userId mismatch)", async () => {
    const mockPrisma = prisma as any;
    mockPrisma.refreshToken.findFirst.mockResolvedValue({
      ...mockRefreshToken,
      userId: "different-user-id",
    });

    await expect(
      rotateRefreshToken(mockReq as Request, mockRes as Response)
    ).rejects.toThrow("Refresh token theft detected");
  });
});
