import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { Prisma } from "@prisma/client";

// Type helper agar Prisma tahu include apa saja yang kita pakai
type ProfileWithRelations = Prisma.ProfilTeamGetPayload<{
  include: {
    userTeam: { select: { email: true } };
    educations: true;
    tools: { include: { tools: true } }; // ✅ pakai "tools" bukan "tool"
    admins: true;
  };
}>;

// CREATE profile
export const createProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, foto, bio, roles, location, phone } = req.body;

    const existing = await prisma.profilTeam.findUnique({
      where: { userTeamId: user.id },
    });

    if (existing) {
      return res
        .status(400)
        .json({ error: "Profil sudah ada, gunakan update." });
    }

    const profile = await prisma.profilTeam.create({
      data: {
        name,
        foto,
        bio,
        roles,
        location,
        phone,
        userTeamId: user.id,
      },
    });

    res.status(201).json({ message: "Profil berhasil dibuat", profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal membuat profil" });
  }
};

// GET profil milik user login
export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const profile: ProfileWithRelations | null =
      await prisma.profilTeam.findUnique({
        where: { userTeamId: user.id },
        include: {
          userTeam: { select: { email: true } },
          educations: true,
          tools: { include: { tools: true } }, // ✅ ambil relasi ke Tools
          admins: true,
        },
      });

    if (!profile) {
      return res.status(404).json({ error: "Profil belum ada" });
    }

    // mapping biar tools langsung berupa daftar Tools
    const result = {
      ...profile,
      tools: profile.tools.map((ptt) => ptt.tools), // ✅ pakai "tools"
    };

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal mengambil profil" });
  }
};

// UPDATE profil user login
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, foto, bio, roles, location, phone } = req.body;

    const existing = await prisma.profilTeam.findUnique({
      where: { userTeamId: user.id },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ error: "Profil belum ada, gunakan create." });
    }

    const profile = await prisma.profilTeam.update({
      where: { userTeamId: user.id },
      data: { name, foto, bio, roles, location, phone },
    });

    res.json({ message: "Profil berhasil diupdate", profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal update profil" });
  }
};

// DELETE profil user login
export const deleteProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const existing = await prisma.profilTeam.findUnique({
      where: { userTeamId: user.id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Profil belum ada" });
    }

    await prisma.profilTeam.delete({
      where: { userTeamId: user.id },
    });

    res.json({ message: "Profil berhasil dihapus" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal menghapus profil" });
  }
};
