import type {
  ForgotPasswordDTO,
  ResetPasswordDTO,
  SigninDTO,
  SignupDTO,
  VerifyOTPDTO,
} from "../validators/auth.validator";
import type { CreateChatDTO } from "../validators/chat.validator";
import type { SendMessageDTO } from "../validators/message.validator";
import api from "./api-client";

{
  /* ----------- Auth mutatoin functoins ----------- */
}
export const signupMutationFn = async (
  input: SignupDTO,
): Promise<StageResponse> => {
  const res = await api.post("/auth/signup", input);
  return res.data;
};

export const signinMutationFn = async (
  input: SigninDTO,
): Promise<TokenResponse> => {
  const res = await api.post("/auth/signin", input);
  return res.data;
};

export const verifyOTPMutationFn = async (
  input: VerifyOTPDTO,
): Promise<TokenResponse> => {
  const res = await api.post("/auth/verify-otp", input);
  return res.data;
};

export const resendOTPMutationFn = async (): Promise<Response> => {
  const res = await api.post("/auth/resend-otp");
  return res.data;
};

export const forgotPasswordMutationFn = async (
  input: ForgotPasswordDTO,
): Promise<StageResponse> => {
  const res = await api.post("/auth/forgot-password", input);
  return res.data;
};

export const resetPasswordMutationFn = async (
  input: ResetPasswordDTO,
): Promise<StageResponse> => {
  const res = await api.post("/auth/reset-password", input);
  return res.data;
};

export const signoutMutationFn = async (): Promise<Response> => {
  const res = await api.post("/auth/signout");
  return res.data;
};

{
  /* ----------- User Query functoins ----------- */
}
export const getProfileQueryFn = async (): Promise<ProfileResponse> => {
  const res = await api.get("/users/profile");
  return res.data;
};

export const getUsersQueryFn = async (): Promise<UsersResponse> => {
  const res = await api.get("/users");
  return res.data;
};

{
  /* ----------- Chat Query functoins ----------- */
}
export const getChatsQueryFn = async (): Promise<ChatsResponse> => {
  const res = await api.get("/chats");
  return res.data;
};

export const getMessagesQueryFn = async (
  id: string,
): Promise<MessagesResponse> => {
  const res = await api.get(`/chats/${id}`);
  return res.data;
};

{
  /* ----------- Chat Mutation functoins ----------- */
}
export const createChatMutationFn = async (
  input: CreateChatDTO,
): Promise<any> => {
  const res = await api.post("/chats", input);
  return res.data;
};

{
  /* ----------- Chat Mutation functoins ----------- */
}
export const sendMessageMutationFn = async (
  input: SendMessageDTO,
): Promise<SendMessageResponse> => {
  const res = await api.post("/messages", input);
  return res.data;
};
