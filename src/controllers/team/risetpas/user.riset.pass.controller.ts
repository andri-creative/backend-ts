import { Request, Response } from "express";
import prisma from "../../../utils/prisma";
import bcrypt from "bcrypt";

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;

    // cek user berdasarkan email
    const user = await prisma.userTeam.findUnique({ where: { email } });
    if (!user)
      return res.status(404).json({ message: "Email tidak terdaftar" });

    // ambil token reset berdasarkan userId
    const tokenData = await prisma.passwordResetToken.findFirst({
      where: { userId: user.id },
    });

    if (!tokenData) {
      return res.status(400).json({ message: "OTP tidak valid" });
    }

    // cek OTP
    if (tokenData.otp !== otp) {
      return res.status(400).json({ message: "OTP tidak valid" });
    }

    // cek expired
    if (tokenData.expiredAt < new Date()) {
      return res.status(400).json({ message: "OTP sudah kadaluarsa" });
    }

    // hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // update password user
    await prisma.userTeam.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // hapus token reset agar tidak bisa dipakai ulang
    await prisma.passwordResetToken.delete({
      where: { id: tokenData.id },
    });

    return res.json({ message: "Password berhasil diubah" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};
