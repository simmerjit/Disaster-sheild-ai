import { Router } from 'express';
import { getMe, syncUser, loginUser } from '../controllers/auth.controller.js';

const router = Router();

// User profile, login & Clerk sync routes
router.get('/me', getMe);
router.post('/sync', syncUser);
router.post('/login', loginUser);

export default router;
