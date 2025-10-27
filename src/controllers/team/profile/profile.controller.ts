import { Request, Response } from "express";
import prisma from "../../../utils/prisma";
import { uploadToGridFS, deleteFileFromGridFS } from "../../../utils/gridfs";

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    isActive: boolean;
  };
}

interface CreateProfileRequest {
  bio?: string;
  tahun?: number;
  locationEdikasi?: string;
  phone?: string;
  lokasiUser?: string;
  degree?: string;
  roles?: string[];
  tools?: string[];
}

interface UpdateProfileRequest {
  bio?: string;
  tahun?: number;
  locationEdikasi?: string;
  phone?: string;
  lokasiUser?: string;
  degree?: string;
  roles?: string[];
  tools?: string[];
}

// CREATE PROFILE dengan upload foto (VERSI SINGKAT)
const createProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  let filename = null;

  try {
    const userId = req.user?.id;
    const profileData = req.body;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Check if profile already exists
    const existingProfile = await prisma.profilTeam.findUnique({
      where: { userTeamId: userId },
    });

    if (existingProfile) {
      res.status(400).json({ error: "Profile sudah ada" });
      return;
    }

    let fotoUrl = null;

    // UPLOAD FOTO DULU
    if (req.file) {
      try {
        filename = await uploadToGridFS(req.file);
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        fotoUrl = `${baseUrl}/api/files/${filename}`;
      } catch (uploadError) {
        console.error("Upload foto error:", uploadError);
        res.status(500).json({ error: "Gagal upload foto" });
        return;
      }
    }

    // PARSE DATA
    const rolesArray = profileData.roles ? JSON.parse(profileData.roles) : [];
    const toolsArray = profileData.tools ? JSON.parse(profileData.tools) : [];

    // CREATE PROFILE DENGAN INCLUDE LANGSUNG
    const profile = await prisma.profilTeam.create({
      data: {
        foto: fotoUrl,
        bio: profileData.bio,
        tahun: profileData.tahun ? parseInt(profileData.tahun) : null,
        locationEdikasi: profileData.locationEdikasi,
        phone: profileData.phone,
        lokasiUser: profileData.lokasiUser,
        degree: profileData.degree,
        userTeamId: userId,
        roles: {
          create: rolesArray.map((roleId: string) => ({
            role: { connect: { id: roleId } },
          })),
        },
        tools: {
          create: toolsArray.map((toolId: string) => ({
            tools: { connect: { id: toolId } },
          })),
        },
      },
      include: {
        roles: {
          include: { role: true },
        },
        tools: {
          include: { tools: true },
        },
      },
    });

    // ✅ LANGSUNG PAKAI profile (SUDAH PASTI ADA)
    res.status(201).json({
      message: "Profile created successfully",
      profile: {
        id: profile.id,
        foto: profile.foto,
        bio: profile.bio,
        tahun: profile.tahun,
        locationEdikasi: profile.locationEdikasi,
        phone: profile.phone,
        lokasiUser: profile.lokasiUser,
        degree: profile.degree,
        roles: profile.roles.map((r) => r.role),
        tools: profile.tools.map((t) => t.tools),
      },
    });
  } catch (error) {
    console.error("Create profile error:", error);

    // 🚨 HAPUS FOTO JIKA CREATE PROFILE GAGAL
    if (filename) {
      try {
        await deleteFileFromGridFS(filename);
        console.log("✅ File dihapus karena create profile gagal");
      } catch (deleteError) {
        console.error("Gagal hapus file:", deleteError);
      }
    }

    res.status(500).json({ error: "Internal server error" });
  }
};

// GET MY PROFILE (GET)
const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const profile = await prisma.profilTeam.findUnique({
      where: { userTeamId: userId },
      include: {
        userTeam: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
    });

    if (!profile) {
      res.status(404).json({ error: "Profile tidak ditemukan" });
      return;
    }

    res.json({
      profile: {
        id: profile.id,
        foto: profile.foto,
        bio: profile.bio,
        tahun: profile.tahun,
        locationEdikasi: profile.locationEdikasi,
        phone: profile.phone,
        lokasiUser: profile.lokasiUser,
        degree: profile.degree,
        user: profile.userTeam,
        roles: profile.roles.map((r) => r.role),
        tools: profile.tools.map((t) => t.tools),
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// UPDATE PROFILE dengan foto dan compression
const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  let newFilename = null;

  try {
    const userId = req.user?.id;
    const profileData = req.body; // Gunakan req.body langsung
    const { id: profileId } = req.params;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Get current profile
    const currentProfile = await prisma.profilTeam.findUnique({
      where: { id: profileId, userTeamId: userId },
      include: {
        roles: true,
        tools: true,
      },
    });

    if (!currentProfile) {
      res.status(404).json({ error: "Profile tidak ditemukan" });
      return;
    }

    let fotoUrl = currentProfile.foto;

    // PARSE DATA
    const rolesArray = profileData.roles ? JSON.parse(profileData.roles) : [];
    const toolsArray = profileData.tools ? JSON.parse(profileData.tools) : [];

    // ✅ HANDLE locationEdikasi JIKA ARRAY
    let locationEdikasiValue = profileData.locationEdikasi;
    if (Array.isArray(locationEdikasiValue)) {
      locationEdikasiValue = locationEdikasiValue.join(", ");
    }

    // Jika ada file baru, upload dan hapus file lama
    if (req.file) {
      try {
        // Hapus foto lama jika ada (extract filename dari URL)
        if (currentProfile.foto) {
          const oldFilename = currentProfile.foto.split("/").pop();
          if (oldFilename) {
            await deleteFileFromGridFS(oldFilename);
            console.log("🗑️ Foto lama dihapus:", oldFilename);
          }
        }

        // Upload foto baru dengan compression
        newFilename = await uploadToGridFS(req.file);
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        fotoUrl = `${baseUrl}/api/files/${newFilename}`;
        console.log("✅ Foto baru diupload:", newFilename);
      } catch (uploadError) {
        console.error("Upload foto error:", uploadError);
        res.status(500).json({ error: "Gagal upload foto" });
        return;
      }
    }

    // Update profile dengan transaction untuk consistency
    const updatedProfile = await prisma.$transaction(async (tx) => {
      // Update profile data
      const profile = await tx.profilTeam.update({
        where: { id: profileId },
        data: {
          foto: fotoUrl,
          bio: profileData.bio,
          tahun: profileData.tahun ? parseInt(profileData.tahun) : null,
          locationEdikasi: locationEdikasiValue,
          phone: profileData.phone,
          lokasiUser: profileData.lokasiUser,
          degree: profileData.degree,
        },
      });

      // Update roles jika provided
      if (profileData.roles !== undefined) {
        // Hapus roles lama
        await tx.profilTeamRoles.deleteMany({
          where: { profilTeamId: profileId },
        });

        // Buat roles baru
        if (rolesArray.length > 0) {
          await tx.profilTeamRoles.createMany({
            data: rolesArray.map((roleId: string) => ({
              profilTeamId: profileId,
              roleId: roleId,
            })),
          });
        }
      }

      // Update tools jika provided
      if (profileData.tools !== undefined) {
        // Hapus tools lama
        await tx.profilTeamTools.deleteMany({
          where: { profilTeamId: profileId },
        });

        // Buat tools baru
        if (toolsArray.length > 0) {
          await tx.profilTeamTools.createMany({
            data: toolsArray.map((toolId: string) => ({
              profilTeamId: profileId,
              toolsId: toolId,
            })),
          });
        }
      }

      return profile;
    });

    // Get full updated profile data
    const fullProfile = await prisma.profilTeam.findUnique({
      where: { id: profileId },
      include: {
        userTeam: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
    });

    if (!fullProfile) {
      throw new Error("Profile tidak ditemukan setelah update");
    }

    res.json({
      message: "Profile updated successfully",
      profile: {
        id: fullProfile.id,
        foto: fullProfile.foto,
        bio: fullProfile.bio,
        tahun: fullProfile.tahun,
        locationEdikasi: fullProfile.locationEdikasi,
        phone: fullProfile.phone,
        lokasiUser: fullProfile.lokasiUser,
        degree: fullProfile.degree,
        user: fullProfile.userTeam,
        roles: fullProfile.roles.map((r) => r.role),
        tools: fullProfile.tools.map((t) => t.tools),
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);

    // 🚨 HAPUS FOTO BARU JIKA UPDATE PROFILE GAGAL
    if (newFilename) {
      try {
        await deleteFileFromGridFS(newFilename);
        console.log("✅ File baru dihapus karena update profile gagal");
      } catch (deleteError) {
        console.error("Gagal hapus file baru:", deleteError);
      }
    }

    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

const getAll = async (req: Request, res: Response) => {
  try {
    const teams = await prisma.userTeam.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        profile: {
          include: {
            roles: {
              select: {
                role: true, // -> ambil object role
              },
            },
            tools: {
              select: {
                tools: true, // -> ambil object tools
              },
            },
          },
        },
        createdAt: true,
      },
    });

    const formatted = teams.map((team) => ({
      ...team,
      profile: team.profile
        ? {
            ...team.profile,
            roles: team.profile.roles.map((r) => r.role),
            tools: team.profile.tools.map((t) => t.tools),
          }
        : null,
    }));

    return res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const getById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const team = await prisma.userTeam.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        profile: {
          include: {
            roles: {
              select: {
                role: true,
              },
            },
            tools: {
              select: {
                tools: true,
              },
            },
          },
        },
        createdAt: true,
      },
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    const formatted = {
      ...team,
      profile: team.profile
        ? {
            ...team.profile,
            roles: team.profile.roles.map((r) => r.role),
            tools: team.profile.tools.map((t) => t.tools),
          }
        : null,
    };

    return res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export { createProfile, getMyProfile, updateProfile, getAll , getById};
