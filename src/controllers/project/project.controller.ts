import { Request, Response } from "express";
import prisma from "../../utils/prisma";
import sharp from "sharp";

import multer from "multer";
import cloudinary from "../../utils/cloudinary";

const storage = multer.memoryStorage();
export const upload = multer({ storage });

// Helper Cloudenary
function UploadToolsCloudinary(fileBuffer: Buffer) {
  return new Promise<any>((resolve, reject) => {
    const now = new Date();
    const fileName = `${now.getSeconds().toString().padStart(2, "0")}${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}${now.getHours().toString().padStart(2, "0")}${now
      .getDate()
      .toString()
      .padStart(2, "0")}${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${now.getFullYear()}`;

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "Project",
        resource_type: "image",
        public_id: `${fileName}.webp`,
        overwrite: true,
        format: "webp",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ ...result, fileName });
      }
    );

    stream.end(fileBuffer);
  });
}

export const getAllProject = async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
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

    // Format response agar lebih clean
    const formattedProjects = projects.map((project) => ({
      ...project,
      tools: project.tools.map((tool) => tool.tools),
    }));

    res.status(200).json({
      message: "Projects retrieved successfully",
      projects: formattedProjects,
    });
  } catch (error) {
    console.error("Error getting projects:", error);
    res.status(500).json({
      message: "Failed to retrieve projects",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const getByIdProject = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        tools: {
          include: {
            tools: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // Format response
    const formattedProject = {
      ...project,
      tools: project.tools.map((tool) => tool.tools),
    };

    res.status(200).json({
      message: "Project retrieved successfully",
      project: formattedProject,
    });
  } catch (error) {
    console.error("Error getting project by id:", error);
    res.status(500).json({
      message: "Failed to retrieve project",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      techStack,
      features,
      tools,
      role,
      demoUrl,
      repoUrl,
    } = req.body;

    // Validasi: File gambar wajib diisi
    if (!req.file) {
      return res.status(400).json({
        message: "File gambar harus ada",
        error: "Image file is required",
      });
    }

    // req.file.buffer sudah berupa Buffer dari multer
    const compressedImg = await sharp(req.file.buffer)
      .webp({ quality: 80 })
      .toBuffer();

    // Upload ke Cloudinary
    const uploadResult = await UploadToolsCloudinary(compressedImg);

    const imgProjectUrl = uploadResult.secure_url;

    // Parse techStack dan features dengan error handling
    let parsedTechStack;
    let parsedFeatures;

    try {
      // Jika sudah array, gunakan langsung
      if (Array.isArray(techStack)) {
        parsedTechStack = techStack;
      }
      // Jika string, coba parse sebagai JSON
      else if (typeof techStack === "string") {
        // Trim whitespace
        const trimmed = techStack.trim();

        // Cek apakah dimulai dengan [ (array JSON)
        if (trimmed.startsWith("[")) {
          parsedTechStack = JSON.parse(trimmed);
        }
        // Jika bukan JSON array, split by comma
        else {
          parsedTechStack = trimmed
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item);
        }
      } else {
        parsedTechStack = [];
      }
    } catch (e) {
      return res.status(400).json({
        message: "Format techStack tidak valid",
        error:
          'techStack harus berupa array JSON atau string dipisah koma. Contoh: ["React","Node.js"] atau "React, Node.js"',
      });
    }

    try {
      // Jika sudah array, gunakan langsung
      if (Array.isArray(features)) {
        parsedFeatures = features;
      }
      // Jika string, coba parse sebagai JSON
      else if (typeof features === "string") {
        const trimmed = features.trim();

        if (trimmed.startsWith("[")) {
          parsedFeatures = JSON.parse(trimmed);
        } else {
          parsedFeatures = trimmed
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item);
        }
      } else {
        parsedFeatures = [];
      }
    } catch (e) {
      return res.status(400).json({
        message: "Format features tidak valid",
        error:
          'features harus berupa array JSON atau string dipisah koma. Contoh: ["Feature 1","Feature 2"] atau "Feature 1, Feature 2"',
      });
    }

    // Parse tools - bisa berupa array ID atau single ID (ini adalah Tools ID, bukan ProjectTools ID)
    let parsedToolIds: string[] = [];
    if (tools) {
      try {
        if (Array.isArray(tools)) {
          // Jika sudah array, gunakan langsung
          parsedToolIds = tools
            .map((id: string) => id.trim())
            .filter((id: string) => id);
        } else if (typeof tools === "string") {
          const trimmed = tools.trim();

          // Jika string array JSON: ["id1", "id2"] atau ['id1', 'id2']
          if (trimmed.startsWith("[")) {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              parsedToolIds = parsed
                .map((id: string) => String(id).trim())
                .filter((id: string) => id);
            }
          }
          // Jika string dengan koma: "id1, id2, id3"
          else if (trimmed.includes(",")) {
            parsedToolIds = trimmed
              .split(",")
              .map((id: string) => id.trim())
              .filter((id: string) => id);
          }
          // Single ID
          else if (trimmed) {
            parsedToolIds = [trimmed];
          }
        }

        // Debug log
        console.log("Parsed Tool IDs:", parsedToolIds);
      } catch (e) {
        console.error("Error parsing tools:", e);
        return res.status(400).json({
          message: "Format tools tidak valid",
          error:
            'tools harus berupa array Tools ID. Contoh: ["68d6c837fc973c153c852dbe", "68dce3f4ebc8384c9546e959"]',
        });
      }
    }

    // Buat project di database
    const project = await prisma.project.create({
      data: {
        title,
        description,
        techStack: parsedTechStack,
        features: parsedFeatures,
        role,
        demoUrl,
        repoUrl,
        image: imgProjectUrl,
        status: false,
        pinned: false,
        // Create ProjectTools yang menghubungkan Project dengan Tools
        tools:
          parsedToolIds.length > 0
            ? {
                create: parsedToolIds.map((toolId: string) => ({
                  toolsId: toolId, // ID dari Tools
                  // projectId akan otomatis diisi oleh Prisma
                })),
              }
            : undefined,
      },
      include: {
        tools: {
          include: {
            tools: true, // Include data Tools untuk response
          },
        },
      },
    });

    res.status(201).json({
      message: "Project berhasil dibuat",
      project: project,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({
      message: "Project Gagal Upload",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      techStack,
      features,
      tools,
      role,
      demoUrl,
      repoUrl,
      pinned,
    } = req.body;

    // Ambil data project yang ada
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return res.status(404).json({
        message: "Project tidak ditemukan",
      });
    }

    let imgProjectUrl: string | undefined;

    // Jika ada file baru yang diupload
    if (req.file) {
      // Hapus foto lama dari Cloudinary jika ada
      if (existingProject.image) {
        try {
          const urlParts = existingProject.image.split("/");
          const uploadIndex = urlParts.findIndex((part) => part === "upload");
          if (uploadIndex !== -1) {
            const publicIdWithExt = urlParts.slice(uploadIndex + 2).join("/");
            const publicId = publicIdWithExt.replace(/\.[^/.]+$/, "");
            await cloudinary.uploader.destroy(publicId);
            console.log(`Old image deleted from Cloudinary: ${publicId}`);
          }
        } catch (cloudinaryError) {
          console.error(
            "Error deleting old image from Cloudinary:",
            cloudinaryError
          );
        }
      }

      // Upload foto baru
      const compressedImg = await sharp(req.file.buffer)
        .webp({ quality: 80 })
        .toBuffer();

      const uploadResult = await UploadToolsCloudinary(compressedImg);

      imgProjectUrl = uploadResult.secure_url;
    }

    // Parse techStack dengan error handling
    let parsedTechStack;
    if (techStack) {
      try {
        if (Array.isArray(techStack)) {
          parsedTechStack = techStack;
        } else if (typeof techStack === "string") {
          const trimmed = techStack.trim();
          if (trimmed.startsWith("[")) {
            parsedTechStack = JSON.parse(trimmed);
          } else {
            parsedTechStack = trimmed
              .split(",")
              .map((item: string) => item.trim())
              .filter((item: string) => item);
          }
        }
      } catch (e) {
        return res.status(400).json({
          message: "Format techStack tidak valid",
          error: "techStack harus berupa array JSON atau string dipisah koma",
        });
      }
    }

    // Parse features dengan error handling
    let parsedFeatures;
    if (features) {
      try {
        if (Array.isArray(features)) {
          parsedFeatures = features;
        } else if (typeof features === "string") {
          const trimmed = features.trim();
          if (trimmed.startsWith("[")) {
            parsedFeatures = JSON.parse(trimmed);
          } else {
            parsedFeatures = trimmed
              .split(",")
              .map((item: string) => item.trim())
              .filter((item: string) => item);
          }
        }
      } catch (e) {
        return res.status(400).json({
          message: "Format features tidak valid",
          error: "features harus berupa array JSON atau string dipisah koma",
        });
      }
    }

    // Parse tools IDs
    let parsedToolIds: string[] = [];
    if (tools) {
      try {
        if (Array.isArray(tools)) {
          parsedToolIds = tools
            .map((id: string) => id.trim())
            .filter((id: string) => id);
        } else if (typeof tools === "string") {
          const trimmed = tools.trim();
          if (trimmed.startsWith("[")) {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              parsedToolIds = parsed
                .map((id: string) => String(id).trim())
                .filter((id: string) => id);
            }
          } else if (trimmed.includes(",")) {
            parsedToolIds = trimmed
              .split(",")
              .map((id: string) => id.trim())
              .filter((id: string) => id);
          } else if (trimmed) {
            parsedToolIds = [trimmed];
          }
        }

        console.log("Parsed Tool IDs for update:", parsedToolIds);
      } catch (e) {
        return res.status(400).json({
          message: "Format tools tidak valid",
          error: "tools harus berupa array Tools ID",
        });
      }
    }

    // Jika ada perubahan tools
    if (parsedToolIds.length > 0) {
      // Hapus semua ProjectTools yang lama
      await prisma.projectTools.deleteMany({
        where: { projectId: id },
      });

      // Tambah ProjectTools yang baru
      await prisma.projectTools.createMany({
        data: parsedToolIds.map((toolId: string) => ({
          projectId: id,
          toolsId: toolId,
        })),
      });
    }

    // Update project
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(parsedTechStack && { techStack: parsedTechStack }),
        ...(parsedFeatures && { features: parsedFeatures }),
        ...(role && { role }),
        ...(demoUrl && { demoUrl }),
        ...(repoUrl && { repoUrl }),
        ...(imgProjectUrl && { image: imgProjectUrl }),
        ...(pinned !== undefined && { pinned }),
      },
      include: {
        tools: {
          include: {
            tools: true,
          },
        },
      },
    });

    res.status(200).json({
      message: "Project berhasil diupdate",
      project: project,
    });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({
      message: "Project Gagal Update",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 1. Dapatkan data project terlebih dahulu untuk mendapatkan image URL
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project tidak ditemukan",
      });
    }

    // 2. Hapus gambar dari Cloudinary jika ada
    if (project.image) {
      try {
        const urlParts = project.image.split("/");
        const uploadIndex = urlParts.findIndex((part) => part === "upload");
        if (uploadIndex !== -1) {
          // Ambil bagian setelah 'upload' dan version (v1234567890)
          const publicIdWithExt = urlParts.slice(uploadIndex + 2).join("/");
          // Hapus extension (.jpg, .png, dll)
          const publicId = publicIdWithExt.replace(/\.[^/.]+$/, "");

          // Hapus dari Cloudinary
          await cloudinary.uploader.destroy(publicId);
          console.log(`Image deleted from Cloudinary: ${publicId}`);
        }
      } catch (cloudinaryError) {
        console.error("Error deleting image from Cloudinary:", cloudinaryError);
        // Lanjutkan menghapus project meskipun gagal hapus gambar
      }
    }

    // 3. Hapus semua ProjectTools yang terkait
    await prisma.projectTools.deleteMany({
      where: { projectId: id },
    });

    // 4. Hapus project dari database
    const deletedProject = await prisma.project.delete({
      where: { id },
    });

    res.status(200).json({
      message: "Project dan gambar berhasil dihapus",
      project: deletedProject,
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({
      message: "Project Gagal Dihapus",
      error: error instanceof Error ? error.message : error,
    });
  }
};
