// src\controllers\education.controller.ts
import { Request, Response } from "express";
import prisma from "../utils/prisma";

// CREATE Education
export const createEducation = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user; // dari JWT middleware
    const { degree, institution, graduationYear } = req.body;

    // cari profil team milik user ini
    const profile = await prisma.profilTeam.findUnique({
      where: { userTeamId: user.id },
    });

    if (!profile) {
      return res.status(404).json({ error: "Profil tidak ditemukan" });
    }

    const education = await prisma.education.create({
      data: {
        degree,
        institution,
        graduationYear,
        profilTeamId: profile.id,
      },
    });

    res.status(201).json(education);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal menambahkan education" });
  }
};

// GET semua education user yang login
export const getMyEducations = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const profile = await prisma.profilTeam.findUnique({
      where: { userTeamId: user.id },
      include: { educations: true },
    });

    if (!profile) {
      return res.status(404).json({ error: "Profil tidak ditemukan" });
    }

    res.json(profile.educations);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data education" });
  }
};

// GET education by ID (hanya milik user sendiri)
export const getEducationById = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const education = await prisma.education.findUnique({
      where: { id },
      include: { profilTeam: true },
    });

    if (!education || education.profilTeam?.userTeamId !== user.id) {
      return res.status(404).json({ error: "Education tidak ditemukan" });
    }

    res.json(education);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil education" });
  }
};

// UPDATE education (hanya milik user sendiri)
export const updateEducation = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { degree, institution, graduationYear } = req.body;

    // pastikan education milik user
    const education = await prisma.education.findUnique({
      where: { id },
      include: { profilTeam: true },
    });

    if (!education || education.profilTeam?.userTeamId !== user.id) {
      return res.status(404).json({ error: "Education tidak ditemukan" });
    }

    const updated = await prisma.education.update({
      where: { id },
      data: { degree, institution, graduationYear },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Gagal update education" });
  }
};

// DELETE education (hanya milik user sendiri)
export const deleteEducation = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // pastikan education milik user
    const education = await prisma.education.findUnique({
      where: { id },
      include: { profilTeam: true },
    });

    if (!education || education.profilTeam?.userTeamId !== user.id) {
      return res.status(404).json({ error: "Education tidak ditemukan" });
    }

    await prisma.education.delete({ where: { id } });

    res.json({ message: "Education berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Gagal hapus education" });
  }
};
