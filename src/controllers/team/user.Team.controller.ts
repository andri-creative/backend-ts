import { Request, Response } from "express";
import prisma from "../../utils/prisma";

export const getAllUserTeam = async (req: Request, res: Response) => {
  try {
    const data = await prisma.userTeam.findMany({
      include: {
        profile: {
          include: {
            tools: {
              include: {
                tools: true,
              },
            },
          },
        },
      },
    });
    const clean = data.map((user) => ({
      ...user,
      profile: user.profile
        ? {
            ...user.profile,
            tools: user.profile.tools.map((t) => t.tools),
          }
        : null,
    }));

    res.status(200).json({
      message: "Berhasil ambil data user team",
      data: clean,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Terjadi kesalahan",
    });
  }
};
