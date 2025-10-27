import { Router } from "express";
import {
  getAllRoles,
  getByIdRoles,
  CreateRoles,
  deleteRoles,
  updateRoles,
} from "../../controllers/roles/roles.controller";

const router = Router()

router.get('/', getAllRoles)
router.get('/:id', getByIdRoles)
router.post('/', CreateRoles)
router.put('/:id', updateRoles)
router.delete('/:id', deleteRoles)

export default router