import {
  createChat,
  getChatWithMessage,
  getUserChats,
} from "@/controllers/chat.controller";
import { inputValidator } from "@/middlewares/input-validator";
import { createChatSchema } from "@/validators/chat.validator";
import { Router } from "express";

const chatRoutes = Router();

chatRoutes.post("/", inputValidator(createChatSchema), createChat);
chatRoutes.get("/", getUserChats);
chatRoutes.get("/:id", getChatWithMessage);

export default chatRoutes;
