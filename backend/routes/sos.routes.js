import { Router } from 'express';
import {
  getAllSOS,
  getSOSById,
  createSOS,
  updateSOS,
  deleteSOS,
} from '../controllers/sos.controller.js';

const router = Router();

router.get('/', getAllSOS);
router.get('/:id', getSOSById);
router.post('/', createSOS);
router.put('/:id', updateSOS);
router.delete('/:id', deleteSOS);

export default router;
