import { Request, Response } from "express";
import prisma from "../../../utils/prisma";
import crypto from "crypto";
import { transporter } from "../../../utils/mailer";

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await prisma.userTeam.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Email tidak terdaftar" });
    }

    // buat OTP 6 digit
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // simpan OTP & expired (misal 15 menit)
    const expiredAt = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.passwordResetToken.upsert({
      where: { userId: user.id },
      update: { otp, expiredAt },
      create: {
        userId: user.id,
        otp,
        expiredAt,
      },
    });


    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Password",
      text: `Kode OTP reset password Anda: ${otp} (berlaku 15 menit)`,
    });

    return res.json({ message: "OTP dikirim ke email" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};
