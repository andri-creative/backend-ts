// src\controllers\userTeam.controller.ts
import { Request, Response } from "express";
import prisma from "../utils/prisma";
import bcrypt from "bcrypt";
import { transporter } from "../utils/mailer";
import jwt from "jsonwebtoken";
import { generateNumericUppercasePassword } from "../utils/generateNumber";

// Regsiter
export const registerUserTeam = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || email.trim() === "") {
      return res.status(400).json({ error: "Email wajib diisi" });
    }

    const existingUser = await prisma.userTeam.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ error: "Email sudah terdaftar" });
    }

    const plainPassword = generateNumericUppercasePassword(6);

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const user = await prisma.userTeam.create({
      data: { email, password: hashedPassword },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Akun Team Anda",
      text: `Halo, ini akun Anda:\n\nEmail: ${email}\nPassword: ${plainPassword}\n\nSilakan login dan ubah password setelah masuk.`,
    });

    res
      .status(201)
      .json({ message: "Registrasi berhasil, cek email Anda", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal registrasi" });
  }
};

// Login
export const loginUserTeam = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // cek apakah user ada
    const user = await prisma.userTeam.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "Email tidak ditemukan" });
    }

    // cocokkan password input dengan hash di DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Password salah" });
    }

    // generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET as string, // taruh di .env
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login berhasil",
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal login" });
  }
};

// Logout
export const logoutUserTeam = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(400).json({ error: "Token tidak ditemukan" });
    }

    // simpan ke blacklist (misalnya Redis atau DB)
    await prisma.tokenBlacklist.create({
      data: { token },
    });

    res.json({ message: "Logout berhasil" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal logout" });
  }
};

// Get all user teams with profile
export const getUserTeamWithEducation = async (req: Request, res: Response) => {
  try {
    const user = await prisma.userTeam.findUnique({
      where: { id: req.params.id },
      include: {
        profile: {
          include: {
            educations: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Gagal ambil data user lengkap" });
  }
};

// Get all User
export const getUserTeamFull = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // id userTeam

    const userTeam = await prisma.userTeam.findUnique({
      where: { id },
      include: {
        profile: {
          include: {
            educations: true,
            tools: {
              include: { tools: true },
            },
          },
        },
      },
    });

    if (!userTeam) {
      return res.status(404).json({ error: "UserTeam tidak ditemukan" });
    }

    // supaya output tools langsung berupa daftar tools
    const result = {
      ...userTeam,
      profile: userTeam.profile
        ? {
            ...userTeam.profile,
            tools: userTeam.profile.tools.map((tt) => tt.tools),
          }
        : null,
    };

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal mengambil data lengkap" });
  }
};

export const getUserTeams = async (req: Request, res: Response) => {
  try {
    const users = await prisma.userTeam.findMany({
      include: { profile: true },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user teams" });
  }
};

export const getUserTeam = async (req: Request, res: Response) => {
  try {
    const user = await prisma.userTeam.findUnique({
      where: { id: req.params.id },
      include: { profile: true },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user team" });
  }
};

export const createUserTeam = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.userTeam.create({ data: { email, password } });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to create user team" });
  }
};

export const updateUserTeam = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.userTeam.update({
      where: { id: req.params.id },
      data: { email, password },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to update user team" });
  }
};

export const deleteUserTeam = async (req: Request, res: Response) => {
  try {
    await prisma.userTeam.delete({ where: { id: req.params.id } });
    res.json({ message: "UserTeam deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user team" });
  }
};

export const getAllUserTeamsFull = async (req: Request, res: Response) => {
  try {
    const page = Math.max(parseInt(String(req.query.page || 1)), 1);
    const pageSize = Math.min(
      Math.max(parseInt(String(req.query.pageSize || 20)), 1),
      100
    );
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      prisma.userTeam.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        // penting: JANGAN kirim password
        select: {
          id: true,
          email: true,
          createdAt: true,
          updatedAt: true,
          profile: {
            include: {
              educations: true,
              tools: { include: { tools: true } },
            },
          },
        },
      }),
      prisma.userTeam.count(),
    ]);

    // rapikan: ubah teamTools -> tools (array Tools), sembunyikan teamTools
    const data = items.map((u) => {
      const p = u.profile;
      if (!p) return { ...u, profile: null };
      const { tools, ...restProfile } = p as any;
      return {
        ...u,
        profile: {
          ...restProfile,
          tools: (tools || []).map((tt: any) => tt.tools),
        },
      };
    });

    res.json({
      page,
      pageSize,
      total,
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal mengambil data user teams (full)" });
  }
};
