declare type VerificationStage =
  | "code_verification"
  | "password_reset"
  | "completed";

declare interface Response {
  message: string;
}

declare interface TokenResponse extends Response {
  accessToken: string;
}

declare interface StageResponse extends Response {
  stage: VerificationStage;
}

declare interface User {
  id: string;
  name: string;
  email: string;
}

declare interface ProfileResponse extends Response {
  user: User;
}

declare interface UsersResponse extends Response {
  users: User[];
}

declare interface Participant {
  id: string;
  name: string;
}

declare interface Chat {
  id: string;
  isGroup: boolean;
  groupName?: string;
  createdById: string;
  participants: Participant[];

  createdBy: Participant;

  createdAt: string;
  updatedAt: string;
}

declare interface ChatsResponse extends Response {
  chats: chat[];
}

declare interface Message {
  id: string;
  content: string;
  createdAt: string;

  sender: Participant;

  replyTo?: string;
}

declare interface ChatMessages {
  id: string;
  isGroup: boolean;
  groupName?: string;
  createdById: string;
  participants: Participant[];

  messages: Message[];
}

declare interface MessagesResponse extends Response {
  chat: ChatMessages;
}

declare interface SendMessageResponse extends Response {
  chatId: string;
}
