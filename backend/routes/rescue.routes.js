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

const router = Router();

// Authentication & Profile
router.post('/login', loginRescueTeam);
router.post('/register', registerRescueTeam);
router.get('/teams', getAllRescueTeams);
router.get('/teams/:id', getRescueTeamById);
router.put('/teams/:id/status', updateRescueTeamStatus);

// Smart Location-based Prioritization Engine
router.get('/prioritize', getPrioritizedRescues);

// Mission Execution Actions
router.post('/mission/action', handleMissionAction);

export default router;
