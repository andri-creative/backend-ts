// src\utils\prisma.ts
// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// export default prisma;

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

export default prisma;
