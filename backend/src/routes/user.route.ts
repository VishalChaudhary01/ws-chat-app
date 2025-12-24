import { getProfile, getUsers } from "@/controllers/user.controller";
import { Router } from "express";

const userRoutes = Router();

userRoutes.get("/profile", getProfile);
userRoutes.get("/", getUsers);

export default userRoutes;
