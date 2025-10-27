import prisma from "../utils/prisma";

export const blacklistToken = async (
  token: string,
  expiresAt: Date
): Promise<void> => {
  await prisma.blacklistedToken.create({
    data: {
      token,
      expiresAt,
    },
  });
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const blacklisted = await prisma.blacklistedToken.findUnique({
    where: { token },
  });

  if (!blacklisted) return false;

  // Hapus token yang sudah expired
  if (new Date() > blacklisted.expiresAt) {
    await prisma.blacklistedToken.delete({
      where: { id: blacklisted.id },
    });
    return false;
  }

  return true;
};
