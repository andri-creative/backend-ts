// src\controllers\teamTools.controller.ts
import { Request, Response } from "express";
import prisma from "../utils/prisma";

// Tambah tools ke profil team
export const addToolToTeam = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user; // dari JWT
    const { toolId } = req.body;

    // cari profil team user
    const profile = await prisma.profilTeam.findUnique({
      where: { userTeamId: user.id },
    });

    if (!profile) {
      return res.status(404).json({ error: "Profil tidak ditemukan" });
    }

    const teamTool = await prisma.profilTeamTools.create({
      data: {
        profilTeamId: profile.id,
        toolsId: toolId,
      },
    });

    res.status(201).json(teamTool);
  } catch (error) {
    res.status(500).json({ error: "Gagal menambahkan tool" });
  }
};

// Lihat semua tools milik team
export const getMyTools = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const profile = await prisma.profilTeam.findUnique({
      where: { userTeamId: user.id },
      include: {
        tools: {
          include: { tools: true },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({ error: "Profil tidak ditemukan" });
    }

    res.json(profile.tools.map((tt) => tt.tools));
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil tools" });
  }
};

// Hapus tool dari team
export const removeToolFromTeam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // id dari ProfilTeamTools

    await prisma.profilTeamTools.delete({ where: { id } });

    res.json({ message: "Tool dihapus dari profil" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus tool" });
  }
};
