import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev-super-secret-jwt-key";

import { Request, Response, NextFunction } from "express";

export interface AuthRequest extends Request {
  user?: { id: string; username: string };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: Missing token" });
    return;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string };
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}

authRouter.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "Username and password required" });
      return;
    }

    const existing = await db.select().from(users).where(eq(users.username, username));
    if (existing.length > 0) {
      res.status(400).json({ error: "Username taken" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(users).values({ username, passwordHash }).returning();

    const token = jwt.sign({ id: user.id, username }, JWT_SECRET, { expiresIn: "7d" });
    
    // Send token as HttpOnly cookie or in payload. We'll send it in payload for simpler frontend handling.
    res.json({ token, user: { id: user.id, username: user.username, balance: user.globalBalance } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const [user] = await db.select().from(users).where(eq(users.username, username));
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = jwt.sign({ id: user.id, username }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, username: user.username, balance: user.globalBalance } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const [user] = await db.select().from(users).where(eq(users.id, decoded.id));
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    res.json({ user: { id: user.id, username: user.username, balance: user.globalBalance } });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});
