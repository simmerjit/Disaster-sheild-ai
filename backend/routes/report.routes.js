// report.routes.js
// TODO: Wire up report controller handlers to their routes.

import { Router } from 'express';
import {
  getAllReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
} from '../controllers/report.controller.js';

const router = Router();

// GET    /api/reports
router.get('/', getAllReports);

// GET    /api/reports/:id
router.get('/:id', getReportById);

// POST   /api/reports
router.post('/', createReport);

// PUT    /api/reports/:id
router.put('/:id', updateReport);

// DELETE /api/reports/:id
router.delete('/:id', deleteReport);

export default router;
