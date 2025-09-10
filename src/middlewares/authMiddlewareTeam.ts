// src\middlewares\authMiddlewareTeam.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma";

export async function authMiddlewareTeam(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Token tidak ada" });
  }

  // cek blacklist
  const blacklisted = await prisma.tokenBlacklist.findUnique({
    where: { token },
  });
  if (blacklisted) {
    return res.status(401).json({ error: "Token sudah di-logout" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token tidak valid" });
  }
}
