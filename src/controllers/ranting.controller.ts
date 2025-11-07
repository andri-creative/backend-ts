import prisma from "../utils/prisma";
import { RantingState } from "../models/ranting";
import { CreateRanting } from "../models/ranting";
import { Request, Response } from "express";

export const getAllRantings = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // ambil data dari "service"
    const rantings = await getAllRantingsData({ page, limit });
    const totalCount = await prisma.ranting.count();
    const stats = await getRantingStats(req, res);

    res.status(200).json({
      success: true,
      message: "Rantings fetched successfully",
      data: {
        rantings,
        stats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching rantings:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllRantingsData = async ({
  page = 1,
  limit = 20,
}: {
  page?: number;
  limit?: number;
}) => {
  const skip = (page - 1) * limit;

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
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: totalCount,
      itemsPerPage: limit,
    },
  };
};

export const createRanting = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { rating } = req.body;

    const labels = ["Very Bad", "Bad", "Neutral", "Good", "Very Good"];
    const label = labels[rating - 1] || "Unknown";

    const newRanting = await prisma.ranting.create({
      data: {
        label,
        rating,
      },
    });

    const stats = await getRantingStats(req, res);

    res.status(201).json({
      success: true,
      message: "Ranting created successfully",
      data: newRanting,
      stats: stats,
    });
  } catch (error) {
    console.error("Error creating ranting:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getRantingStats = async (req: Request, res: Response) => {
  try {
    const averageRating = await prisma.ranting.aggregate({
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    const distribution = await prisma.ranting.groupBy({
      by: ["rating"],
      _count: {
        rating: true,
      },
    });

    const rantingDistribution: RantingState["rantingDistribution"] = {
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0,
    };
    distribution.forEach((item) => {
      switch (item.rating) {
        case 1:
          rantingDistribution["1"] = item._count.rating;
          break;
        case 2:
          rantingDistribution["2"] = item._count.rating;
          break;
        case 3:
          rantingDistribution["3"] = item._count.rating;
          break;
        case 4:
          rantingDistribution["4"] = item._count.rating;
          break;
        case 5:
          rantingDistribution["5"] = item._count.rating;
          break;
        default:
          break;
      }
    });

    return {
      averageRating: averageRating._avg.rating || 0,
      totalRating: averageRating._count.rating || 0,
      rantingDistribution,
    };
  } catch (error) {
    console.error("Error fetching ranting state:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Tambahkan fungsi baru khusus untuk internal use (tidak merusak existing)
export const getRantingStatsData = async () => {
  try {
    const averageRating = await prisma.ranting.aggregate({
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    const distribution = await prisma.ranting.groupBy({
      by: ["rating"],
      _count: {
        rating: true,
      },
    });

    const rantingDistribution: RantingState["rantingDistribution"] = {
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0,
    };
    distribution.forEach((item) => {
      switch (item.rating) {
        case 1:
          rantingDistribution["1"] = item._count.rating;
          break;
        case 2:
          rantingDistribution["2"] = item._count.rating;
          break;
        case 3:
          rantingDistribution["3"] = item._count.rating;
          break;
        case 4:
          rantingDistribution["4"] = item._count.rating;
          break;
        case 5:
          rantingDistribution["5"] = item._count.rating;
          break;
        default:
          break;
      }
    });

    return {
      averageRating: averageRating._avg.rating || 0,
      totalRating: averageRating._count.rating || 0,
      rantingDistribution,
    };
  } catch (error) {
    console.error("Error fetching ranting stats data:", error);
    throw error; // Biarkan error ditangkap oleh caller
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const state = await getRantingStats(req, res);
    res.status(200).json({
      success: true,
      message: "Ranting state fetched successfully",
      data: state,
    });
  } catch (error) {
    console.error("Error fetching ranting state:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteRanting = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedRanting = await prisma.ranting.delete({
      where: {
        id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Ranting deleted successfully",
      data: deletedRanting,
    });
  } catch (error) {
    console.error("Error deleting ranting:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
