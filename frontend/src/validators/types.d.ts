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
