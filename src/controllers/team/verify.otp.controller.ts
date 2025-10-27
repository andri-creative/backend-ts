import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import jwt from "jsonwebtoken";

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const user = await prisma.userTeam.findUnique({ where: { email } });

    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });
    if (user.otp !== otp) return res.status(400).json({ message: "OTP salah" });

    await prisma.userTeam.update({
      where: { email },
      data: { isActive: true, otp: null },
    });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET as string, { expiresIn: "1d" });

    res.status(200).json({
      message: "Verifikasi berhasil",
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};
