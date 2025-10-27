// controllers/team/auth.logout.controller.ts
import { Request, Response } from "express";
import prisma from "../../utils/prisma";

export const logoutUser = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (token) {
      await prisma.blacklistedToken.create({
        data: {
          token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), 
        },
      });
    }

    res.status(200).json({
      message: "Logout berhasil",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};
