import prisma from "../utils/prisma";

export const saveAchievementToDB = async (data: any) => {
  return prisma.achievement.create({
    data: {
      ...data,
      tags: typeof data.tags === "string" ? JSON.parse(data.tags) : data.tags,
      uploadStatus: "completed",
    },
  });
};
