import { Router } from "express";
import {
  createProject,
  deleteProject,
  getAllProject,
  getByIdProject,
  updateProject,
  upload,
} from "../../controllers/project/project.controller";

const router = Router();

router.get("/", getAllProject);
router.get("/:id", getByIdProject);
router.post("/", upload.single("files"), createProject);
router.put('/:id', upload.single('files'), updateProject)
router.delete('/:id', deleteProject)

export default router;
