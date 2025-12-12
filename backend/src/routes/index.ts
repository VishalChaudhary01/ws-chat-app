import { Router } from "express";
import authRoutes from "./auth.route";
import userRoutes from "./user.route";
import { verifyAuth } from "@/middlewares/verify-auth";

const appRoutes = Router();

appRoutes.use("/auth", authRoutes);
appRoutes.use("/users", verifyAuth, userRoutes);

export default appRoutes;
