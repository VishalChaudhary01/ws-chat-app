import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "@/config/db.config";
import { StatusCode } from "@/config/http.config";
import { AppError } from "@/utils/app-error";
import { SigninInput, SignupInput } from "@/validators/auth.validator";
import { generateOTP, generateRefreshToken, hashToken } from "@/utils/crypto";
import { VerificationType } from "@/@generated/enums";
import { signJwt, VerificationTPayload, verifyJwt } from "@/utils/jwt";
import { Env } from "@/config/env.config";
import { logger } from "@/utils/logger";
import { clearCookie, getCookie, setCookie } from "@/utils/cookie";

export async function signup(req: Request, res: Response) {
  const inputs: SignupInput = req.body;

  const { user, OTP } = await prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: { email: inputs.email },
    });
    if (existingUser) {
      if (existingUser.emailVerified) {
        throw new AppError("Email already has registered", StatusCode.CONFLICT);
      }
      // Cleanup old unverified account
      await tx.refreshToken.deleteMany({ where: { userId: existingUser.id } });
      await tx.verificationCode.deleteMany({
        where: { userId: existingUser.id },
      });
      await tx.user.delete({ where: { id: existingUser.id } });
    }

    const hashedPassword = await bcrypt.hash(inputs.password, 12);

    const user = await tx.user.create({
      data: { ...inputs, password: hashedPassword },
    });

    const { OTP, hashedOTP } = generateOTP();
    await tx.verificationCode.create({
      data: {
        userId: user.id,
        code: hashedOTP,
        type: VerificationType.CONFIRM_EMAIL,
        expiresAt: new Date(Date.now() + 15 * 60 * 10000),
      },
    });
    return { user, OTP };
  });

  const verificationToken = signJwt(
    { userId: user.id, verificationType: VerificationType.CONFIRM_EMAIL },
    Env.VERIFICATION_TOKEN_SECRET
  );

  // TODO --> Send verification code to email
  logger.info(`Email: ${user.email}, otp: ${OTP}`);

  setCookie(res, "verification_token", verificationToken);
  res.status(StatusCode.CREATED).json({
    message:
      "User registered successfully. Please check your email for verification code.",
    stage: "code_verification",
  });
}

// Verify for both signup and password_reset requests
export async function verifyOTP(req: Request, res: Response) {
  const OTP: string = req.body.otp;

  let accessToken;
  const { refreshToken, hashedRefreshToken } = generateRefreshToken();

  const token = await getCookie(req, "verification_token");
  if (!token) {
    throw new AppError(
      "Invalid or expired verification session",
      StatusCode.UNAUTHORIZED
    );
  }

  const payload = verifyJwt<VerificationTPayload>(
    token,
    Env.VERIFICATION_TOKEN_SECRET
  );
  if (!payload) {
    throw new AppError(
      "Invalid or expired verification session",
      StatusCode.UNAUTHORIZED
    );
  }

  const { verificationType, userId } = payload;

  if (verificationType === "PASSWORD_RESET") {
    if (!payload.stage || payload.stage !== "code_verification") {
      throw new AppError(
        "Invalid operation for current stage",
        StatusCode.BAD_REQUEST
      );
    }
  }

  const verificationCode = await prisma.verificationCode.findFirst({
    where: { userId, type: verificationType },
  });
  if (!verificationCode || verificationCode?.expiresAt < new Date()) {
    throw new AppError(
      "Verification session expired. Please request again",
      StatusCode.BAD_REQUEST
    );
  }

  // Compare hashed OTP
  const isValidOTP = await bcrypt.compare(OTP, verificationCode.code);
  if (!isValidOTP) {
    throw new AppError("Invalid verification OTP", StatusCode.BAD_REQUEST);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("User not found", StatusCode.NOT_FOUND);
  }

  if (verificationType === "CONFIRM_EMAIL") {
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });
  }

  await prisma.verificationCode.deleteMany({
    where: { userId, type: verificationType },
  });

  if (verificationType === "PASSWORD_RESET") {
    const verificationToken = signJwt(
      {
        userId,
        verificationType: VerificationType.PASSWORD_RESET,
        stage: "password_reset",
        codeVerified: true,
      },
      Env.VERIFICATION_TOKEN_SECRET
    );
    setCookie(res, "verification_token", verificationToken);

    return res.status(StatusCode.OK).json({
      message: "Code verified successfully. You can now reset your password.",
      stage: "password_reset",
    });
  } else {
    accessToken = signJwt({ userId: user.id });

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: hashedRefreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    clearCookie(res, "verification_token");
  }

  //   TODO ---> SEND WELCOME EMAIL

  setCookie(res, "refresh_token", refreshToken);
  res.status(StatusCode.OK).json({
    message: "Email verified successfully",
    accessToken,
  });
}

// Resend for both signup and password_reset requests
export async function resendCode(req: Request, res: Response) {
  const token = await getCookie(req, "verification_token");
  if (!token) {
    throw new AppError(
      "No active code verification session",
      StatusCode.NOT_FOUND
    );
  }

  const payload = verifyJwt<VerificationTPayload>(
    token,
    Env.VERIFICATION_TOKEN_SECRET
  );
  if (!payload) {
    throw new AppError("Invalid or expired token", StatusCode.UNAUTHORIZED);
  }

  const { verificationType, userId } = payload;

  if (verificationType === "PASSWORD_RESET") {
    if (payload.stage && payload.stage !== "code_verification") {
      throw new AppError(
        "Cannot resend code at this stage",
        StatusCode.BAD_REQUEST
      );
    }
  }

  const verificationCode = await prisma.verificationCode.findFirst({
    where: { userId, type: verificationType },
  });

  // check if verification code exists and not expired
  if (!verificationCode || verificationCode.expiresAt < new Date()) {
    throw new AppError(
      "Invalid or expired verification code",
      StatusCode.BAD_REQUEST
    );
  }

  // rate limit: 1 request per 60 seconds
  if (verificationCode.createdAt.getTime() + 60 * 1000 > Date.now()) {
    throw new AppError(
      "Too many requests, please wait before request",
      StatusCode.TOO_MANY_REQUESTS
    );
  }

  // remove old OTP
  await prisma.verificationCode.deleteMany({
    where: { userId, type: verificationType },
  });

  // create new OTP
  const { OTP, hashedOTP } = generateOTP();

  await prisma.verificationCode.create({
    data: {
      userId,
      code: hashedOTP,
      type: verificationType,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  // TODO --> SEND VERIFICATION OTP TO EMAIL
  console.log(`New password reset code for ${user?.email}: ${OTP}`);

  if (verificationType === "PASSWORD_RESET") {
    return res.status(StatusCode.OK).json({
      message: "New verification code sent",
      stage: "code_verification",
    });
  }

  res.status(StatusCode.OK).json({
    message: "New verification code sent",
    stage: "code_verification",
  });
}

export async function forgotPassword(req: Request, res: Response) {
  const email: string = req.body.email;

  const user = await prisma.user.findFirst({
    where: { email, emailVerified: true },
  });

  // Always return success (don't reveal if email exists)
  const genericResponse = () =>
    res.status(StatusCode.OK).json({
      message:
        "If an account exists with this email, you will receive a password reset code.",
      stage: "code_verification",
    });

  if (!user) {
    // Still take same time
    await bcrypt.hash("dummy", 12);
    return genericResponse();
  }

  // Delete old password reset codes
  await prisma.verificationCode.deleteMany({
    where: { userId: user.id, type: VerificationType.PASSWORD_RESET },
  });

  const { OTP, hashedOTP } = generateOTP();

  await prisma.verificationCode.create({
    data: {
      userId: user.id,
      code: hashedOTP,
      type: VerificationType.PASSWORD_RESET,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  const verificationToken = signJwt(
    {
      userId: user.id,
      verificationType: VerificationType.PASSWORD_RESET,
      stage: "code_verification",
    },
    Env.VERIFICATION_TOKEN_SECRET
  );

  // TODO: Send code to email

  console.log(`Password reset code for ${email}: ${OTP}`);

  setCookie(res, "verification_token", verificationToken);

  return genericResponse();
}

export async function resetPassword(req: Request, res: Response) {
  const password: string = req.body.password;

  const token = await getCookie(req, "verification_token");
  if (!token) {
    throw new AppError("Password reset session expired", StatusCode.NOT_FOUND);
  }

  const payload = verifyJwt<VerificationTPayload>(
    token,
    Env.VERIFICATION_TOKEN_SECRET
  );
  if (
    !payload ||
    payload.verificationType !== "PASSWORD_RESET" ||
    !payload.codeVerified
  ) {
    throw new AppError(
      "Invalid password reset session",
      StatusCode.UNAUTHORIZED
    );
  }

  const { userId, stage } = payload;

  if (stage !== "password_reset") {
    throw new AppError("Please verify your code first", StatusCode.BAD_REQUEST);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user || !user.emailVerified) {
    throw new AppError("User not found", StatusCode.NOT_FOUND);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await tx.refreshToken.deleteMany({
      where: { userId },
    });

    await tx.verificationCode.deleteMany({
      where: { userId, type: "PASSWORD_RESET" },
    });
  });

  clearCookie(res, "verification_token");

  // TODO: Send password change notificatoin email

  res.status(StatusCode.OK).json({
    message:
      "Password reset successfully. Please login with your new password.",
    stage: "completed",
  });
}

export async function signin(req: Request, res: Response) {
  const inputs: SigninInput = req.body;

  const user = await prisma.user.findFirst({
    where: { email: inputs.email, emailVerified: true },
  });
  if (!user) {
    throw new AppError("Invalid credentials", StatusCode.UNAUTHORIZED);
  }

  const matchPassword = await bcrypt.compare(inputs.password, user.password);
  if (!matchPassword) {
    throw new AppError("Invalid credentials", StatusCode.BAD_REQUEST);
  }

  // Limit max 3 active sessions per user
  const activeTokens = await prisma.refreshToken.count({
    where: { userId: user.id, isActive: true },
  });

  if (activeTokens > 3) {
    const oldestToken = await prisma.refreshToken.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });
    if (oldestToken) {
      await prisma.refreshToken.delete({ where: { id: oldestToken.id } });
    }
  }

  const accessToken = signJwt({ userId: user.id });
  const { refreshToken, hashedRefreshToken } = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: hashedRefreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  setCookie(res, "refresh_token", refreshToken);

  res.status(StatusCode.OK).json({
    message: "Logged in successfully",
    accessToken,
  });
}

export async function signout(req: Request, res: Response) {
  const refreshToken = getCookie(req, "refresh_token");
  const hashedRefreshToken = hashToken(refreshToken);

  await prisma.refreshToken.delete({
    where: { token: hashedRefreshToken },
  });
  clearCookie(res, "refresh_token");
  res.status(StatusCode.OK).json({ message: "Logged out successfully" });
}

export async function rotateRefreshToken(req: Request, res: Response) {
  const refreshToken = getCookie(req, "refresh_token");
  if (!refreshToken) {
    throw new AppError("Refresh token not found", StatusCode.UNAUTHORIZED);
  }
  const hashedRefreshToken = hashToken(refreshToken);
  const refToken = await prisma.refreshToken.findFirst({
    where: { token: hashedRefreshToken },
  });

  if (!refToken || refToken.expiresAt.getTime() < Date.now()) {
    throw new AppError(
      "Invalid or expired refresh_token",
      StatusCode.UNAUTHORIZED
    );
  }

  if (!refToken.isActive) {
    // Theft refresh_token detected revoke all token of this user
    await prisma.refreshToken.updateMany({
      where: { userId: refToken.userId },
      data: { isActive: false },
    });

    throw new AppError("Refresh token theft detected", StatusCode.UNAUTHORIZED);
  }

  // revoke old token
  await prisma.refreshToken.update({
    where: { token: hashedRefreshToken },
    data: { isActive: false },
  });

  // Generate new refresh + access token
  const { refreshToken: newRefreshToken, hashedRefreshToken: newHashedToken } =
    generateRefreshToken();
  const accessToken = signJwt(
    { userId: refToken.userId },
    Env.ACCESS_TOKEN_SECRET
  );

  await prisma.refreshToken.create({
    data: {
      userId: refToken.userId,
      token: newHashedToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  setCookie(res, "refresh_token", newRefreshToken);

  res.status(StatusCode.OK).json({
    message: "Access Token re-generated",
    accessToken,
  });
}
