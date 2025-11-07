import { Request, Response } from "express";

import prisma from "../../utils/prisma";

export const getAllRoles = async (req: Request, res: Response) => {
  try {
    const role = await getAllRolesData();

    res.status(200).json({ message: "Data all", role });
  } catch (error) {
    console.log(error);
  }
};

// Return data
export const getAllRolesData = async () => {
  return await prisma.roles.findMany();
};

export const getByIdRoles = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const role = await prisma.roles.findUnique({
      where: { id },
    });

    if (!role) return res.status(404).json({ error: "Roles tidak ada" });

    res.status(200).json({ message: "Data By Id", role });
  } catch (error) {
    console.log(error);
  }
};

export const CreateRoles = async (req: Request, res: Response) => {
  try {
    const { title } = req.body;

    let data;
    if (Array.isArray(title)) {
      data = await Promise.all(
        title.map(async (t) =>
          prisma.roles.create({
            data: { title: t },
          })
        )
      );
    } else {
      data = await prisma.roles.create({
        data: { title },
      });
    }

    res.status(200).json({ message: "Roles berhasil", data });
  } catch (error) {
    console.log(error);
  }
};

export const updateRoles = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const role = await prisma.roles.update({
      where: { id },
      data: {
        title,
      },
    });

    res.status(200).json({ message: "Data berhasil update" });
  } catch (error) {
    console.log(error);
  }
};

export const deleteRoles = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const role = await prisma.roles.delete({ where: { id } });

    res.status(200).json({ message: "Berhasil" });
  } catch (error) {
    console.log(error);
  }
};
