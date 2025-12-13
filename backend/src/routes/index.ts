import { Router } from "express";
import authRoutes from "./auth.route";
import userRoutes from "./user.route";
import { verifyAuth } from "@/middlewares/verify-auth";
import chatRoutes from "./chat.route";
import messageRoutes from "./message.route";

const appRoutes = Router();

appRoutes.use("/auth", authRoutes);
appRoutes.use("/users", verifyAuth, userRoutes);
appRoutes.use("/chats", verifyAuth, chatRoutes);
appRoutes.use("/messages", verifyAuth, messageRoutes);
export default appRoutes;
