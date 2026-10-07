import { Router } from 'express';
import { getMe, syncUser, loginUser } from '../controllers/auth.controller.js';
import { protect, requireAuth, requireDemoAuth } from '../middleware/auth.middleware.js';

const router = Router();

// User profile, login & Clerk sync routes
router.get('/me', protect, requireAuth, getMe);
router.post('/sync', syncUser);
router.post('/login', requireDemoAuth, loginUser);

export default router;
