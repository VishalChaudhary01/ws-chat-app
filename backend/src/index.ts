import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { Env } from "@/config/env.config";

const app = express();
const PORT = Env.PORT;

app.get("/health", (_req, res) => {
  res.status(200).json({ message: "Healthy server" });
});

app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
