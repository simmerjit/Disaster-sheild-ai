import { Router } from 'express';
import {
  loginRescueTeam,
  registerRescueTeam,
  getAllRescueTeams,
  getRescueTeamById,
  updateRescueTeamStatus,
  getPrioritizedRescues,
  handleMissionAction,
} from '../controllers/rescue.controller.js';
import {
  authorize,
  authorizeTeamAccess,
  protect,
  requireAuth,
  requireDemoAuth,
} from '../middleware/auth.middleware.js';

const router = Router();

// Authentication & Profile
router.post('/login', requireDemoAuth, loginRescueTeam);
router.post('/register', protect, requireAuth, authorize('admin'), registerRescueTeam);
router.get('/teams', getAllRescueTeams);
router.get('/teams/:id', getRescueTeamById);
router.put(
  '/teams/:id/status',
  protect,
  requireAuth,
  authorize('admin', 'coordinator', 'rescue_worker'),
  authorizeTeamAccess('params'),
  updateRescueTeamStatus
);

// Smart Location-based Prioritization Engine
router.get(
  '/prioritize',
  protect,
  requireAuth,
  authorize('admin', 'coordinator', 'rescue_worker'),
  getPrioritizedRescues
);

// Mission Execution Actions
router.post(
  '/mission/action',
  protect,
  requireAuth,
  authorize('admin', 'coordinator', 'rescue_worker'),
  authorizeTeamAccess('body'),
  handleMissionAction
);

export default router;
