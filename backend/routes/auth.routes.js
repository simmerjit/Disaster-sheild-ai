import { Router } from 'express';
import { getMe, syncUser } from '../controllers/auth.controller.js';

const router = Router();

// User profile & Clerk sync routes
router.get('/me', getMe);
router.post('/sync', syncUser);

export default router;
