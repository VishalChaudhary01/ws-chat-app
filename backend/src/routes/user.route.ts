import { getProfile, getUsers } from "@/controllers/user.controller";
import { Router } from "express";

const userRoutes = Router();

userRoutes.get("/profil", getProfile);
userRoutes.get("/", getUsers);

export default userRoutes;
