import { Router } from 'express';
import { authorize, protect, requireAuth } from '../middleware/auth.middleware.js';
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
router.put('/:id', protect, requireAuth, authorize('admin', 'coordinator', 'rescue_worker'), updateSOS);
router.delete('/:id', protect, requireAuth, authorize('admin', 'coordinator'), deleteSOS);

export default router;
