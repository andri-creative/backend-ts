import prisma from "../../utils/prisma";
import { getRantingStatsData } from "../ranting.controller";

export const getAllRolesData = async ({
  page = 1,
  limit = 20,
}: {
  page?: number;
  limit?: number;
}) => {
  const skip = (page - 1) * limit;

  const totalCount = await prisma.roles.count();

  const roles = await prisma.roles.findMany({
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  const totalPages = Math.ceil(totalCount / limit);

  return {
    roles,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: totalCount,
      itemsPerPage: limit,
    },
  };
};

export const getAllToolsData = async ({
  page = 1,
  limit = 20,
}: {
  page?: number;
  limit?: number;
}) => {
  const skip = (page - 1) * limit;

  const totalCount = await prisma.tools.count();

  const tools = await prisma.tools.findMany({
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  const totalPages = Math.ceil(totalCount / limit);

  return {
    tools,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: totalCount,
      itemsPerPage: limit,
    },
  };
};

export const getAllAchievementData = async ({
  page = 1,
  limit = 20,
}: {
  page?: number;
  limit?: number;
}) => {
  const skip = (page - 1) * limit;

  // total semua data achievement
  const totalCount = await prisma.achievement.count();

  const achievement = await prisma.achievement.findMany({
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      src: true,
      issuer: true,
      label: true,
      issueDate: true,
      description: true,
      category: true,
      level: true,
      tags: true,
      status: true,
      pinned: true,
      uploadStatus: true,
      createdAt: true,
    },
  });

  const totalPages = Math.ceil(totalCount / limit);

  return {
    achievement,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: totalCount,
      itemsPerPage: limit,
    },
  };
};

export const getAllRantingsData = async ({
  page = 1,
  limit = 20,
}: {
  page?: number;
  limit?: number;
}) => {
  const skip = (page - 1) * limit;
  const stats = await getRantingStatsData();

  // total semua data ranting
  const totalCount = await prisma.ranting.count();

  // ambil data ranting sesuai page & limit
  const rantings = await prisma.ranting.findMany({
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },

    select: {
      id: true,
      rating: true,
      label: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const totalPages = Math.ceil(totalCount / limit);

  return {
    rantings,
    stats,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: totalCount,
      itemsPerPage: limit,
    },
  };
};

export const getAllAlbumData = async ({
  page = 1,
  limit = 20,
}: {
  page?: number;
  limit?: number;
}) => {
  const skip = (page - 1) * limit;

  return await prisma.myAlbum.findMany({
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      width: true,
      height: true,
      url: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const getAllUserData = async ({
  page = 1,
  limit = 20,
}: {
  page?: number;
  limit?: number;
}) => {
  const skip = (page - 1) * limit;

  const totalCount = await prisma.userTeam.count();

  const users = await prisma.userTeam.findMany({
    skip,
    take: limit,
    include: {
      profile: {
        include: {
          roles: {
            include: { role: true },
          },
          tools: {
            include: { tools: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

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

  const totalPages = Math.ceil(totalCount / limit);

  return {
    users: formattedUsers,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: totalCount,
      itemsPerPage: limit,
    },
  };
};

export const getAllProjectData = async ({
  page = 1,
  limit = 20,
}: {
  page?: number;
  limit?: number;
}) => {
  const skip = (page - 1) * limit;

  // Hitung total jumlah project
  const totalCount = await prisma.project.count();

  // Ambil data dengan pagination
  const projects = await prisma.project.findMany({
    skip,
    take: limit,
    include: {
      tools: {
        include: {
          tools: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Format data agar lebih clean untuk frontend
  const formattedProjects = projects.map((project) => ({
    ...project,
    tools: project.tools.map((tool) => tool.tools),
  }));

  // Hitung total halaman
  const totalPages = Math.ceil(totalCount / limit);

  return {
    projects: formattedProjects,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: totalCount,
      itemsPerPage: limit,
    },
  };
};
