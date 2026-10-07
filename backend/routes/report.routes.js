import { Router } from 'express';
import {
  getAllReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
} from '../controllers/report.controller.js';
import { protect, requireAuth, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Public reads remain accessible; writes can attach authenticated user context when available.
router.get('/', getAllReports);
router.get('/:id', getReportById);
router.post('/', protect, createReport);
router.put('/:id', protect, requireAuth, authorize('citizen', 'admin', 'coordinator', 'rescue_worker'), updateReport);
router.delete('/:id', protect, requireAuth, authorize('admin', 'coordinator', 'rescue_worker'), deleteReport);

export default router;
