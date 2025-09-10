// src\controllers\tools.controller.ts
import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const getAllTools = async (req: Request, res: Response) => {
  try {
    const tools = await prisma.tools.findMany();
    res.json(tools);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal mengambil semua tools" });
  }
};

export const getToolById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tool = await prisma.tools.findUnique({
      where: { id },
    });
    if (!tool) {
      return res.status(404).json({ error: "Tool tidak ditemukan" });
    }
    res.json(tool);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal mengambil tool" });
  }
};

export const createTool = async (req: Request, res: Response) => {
  try {
    const { title, image, url } = req.body;
    const tool = await prisma.tools.create({
      data: { title, image, url },
    });
    res.status(201).json({ message: "Tool berhasil dibuat", tool });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal membuat tool" });
  }
};

export const updateTool = async (req: Request, res: Response) => {
  try {
    const { title, image, url } = req.body;
    const tool = await prisma.tools.update({
      where: { id: req.params.id },
      data: { title, image, url },
    });
    res.status(200).json({ message: "Tool berhasil diupdate", tool });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal mengupdate tool" });
  }
};

export const deleteTool = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.tools.delete({
      where: { id },
    });
    res.status(200).json({ message: "Tool berhasil dihapus" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal menghapus tool" });
  }
};
