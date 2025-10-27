import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import bcrypt from "bcrypt";
import { transporter } from "../../utils/mailer";

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const existing = await prisma.userTeam.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.userTeam.create({
      data: { name, email, password: hashedPassword, otp },
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Kode OTP Verifikasi",
      text: `Kode OTP Anda: ${otp}`,
      html: `<h3>Kode OTP Anda</h3><p>${otp}</p>`,
    });

    res.status(201).json({
      message: "Registrasi berhasil. Silakan cek email untuk verifikasi.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};
