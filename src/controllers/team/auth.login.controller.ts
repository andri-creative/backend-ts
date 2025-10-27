import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.userTeam.findUnique({ where: { email } });

    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });
    if (!user.isActive)
      return res.status(400).json({ message: "Akun belum diverifikasi" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Password salah" });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    res.status(200).json({ 
      message: "Login berhasil", 
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
        
      }
    });

    // res.status(200).json({ message: "Login berhasil", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};
