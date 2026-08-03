import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { validateCredentials, issueToken } from "../services/authService";

export const authRouter = Router();

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { username, password } = req.body ?? {};
    if (typeof username !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "username and password are required" });
      return;
    }

    if (!validateCredentials(username, password)) {
      res.status(401).json({ error: "invalid credentials" });
      return;
    }

    res.json({ token: issueToken() });
  })
);
