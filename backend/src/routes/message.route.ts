import { sendMessage } from "@/controllers/message.controller";
import { inputValidator } from "@/middlewares/input-validator";
import { sendMessageSchema } from "@/validators/message.validator";
import { Router } from "express";

const messageRoutes = Router();

messageRoutes.post("/", inputValidator(sendMessageSchema), sendMessage);

export default messageRoutes;
