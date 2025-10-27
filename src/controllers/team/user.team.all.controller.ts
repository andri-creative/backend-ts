import { Request, Response } from "express";
import prisma from "../../utils/prisma";

export const getAllUser = async (req: Request, res: Response) => {
  try {
    const users = await prisma.userTeam.findMany({
      include: {
        profile: {
          include: {
            roles: {
              include: {
                role: true,
              },
            },
            tools: {
              include: {
                tools: true,
              },
            },
          },
        },
      },
    });

    // Format data biar rapi untuk frontend
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      profile: user.profile
        ? {
            id: user.profile.id,
            foto: user.profile.foto,
            bio: user.profile.bio,
            tahun: user.profile.tahun,
            locationEdikasi: user.profile.locationEdikasi,
            phone: user.profile.phone,
            lokasiUser: user.profile.lokasiUser,
            degree: user.profile.degree,
            roles: user.profile.roles.map((r) => ({
              id: r.role.id,
              title: r.role.title,
            })),
            tools: user.profile.tools.map((t) => ({
              id: t.tools.id,
              name: t.tools.title,
            })),
          }
        : null,
      createdAt: user.createdAt,
    }));

    return res.status(200).json({
      message: "Berhasil mengambil semua user beserta profil",
      users: formattedUsers,
    });
  } catch (error) {
    console.error("Error getAllUser:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan pada server",
    });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.userTeam.findUnique({
      where: { id },
      include: {
        profile: {
          include: {
            roles: {
              include: {
                role: true,
              },
            },
            tools: {
              include: {
                tools: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    // Format data biar rapi
    const formattedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      profile: user.profile
        ? {
            id: user.profile.id,
            foto: user.profile.foto,
            bio: user.profile.bio,
            tahun: user.profile.tahun,
            locationEdikasi: user.profile.locationEdikasi,
            phone: user.profile.phone,
            lokasiUser: user.profile.lokasiUser,
            degree: user.profile.degree,
            roles: user.profile.roles.map((r) => ({
              id: r.role.id,
              title: r.role.title,
            })),
            tools: user.profile.tools.map((t) => ({
              id: t.tools.id,
              name: t.tools.title,
            })),
          }
        : null,
      createdAt: user.createdAt,
    };

    return res.status(200).json({
      message: "Berhasil mengambil data user berdasarkan ID",
      user: formattedUser,
    });
  } catch (error) {
    console.error("Error getUserById:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan pada server",
    });
  }
};
