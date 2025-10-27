import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { isTokenBlacklisted } from "../services/tokenService";
import prisma from "../utils/prisma";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        isActive: boolean;
      };
    }
  }
}

interface JwtPayload {
  userId: string;
  email: string;
}

const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Token required" });
    return;
  }

  try {
    // CEK APAKAH TOKEN DI BLACKLIST
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      res.status(401).json({ error: "Token telah di-blacklist" });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    const user = await prisma.userTeam.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, isActive: true },
    });

    if (!user) {
      res.status(401).json({ error: "User tidak ditemukan" });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ error: "Token invalid" });
  }
};

export { authenticateToken };
