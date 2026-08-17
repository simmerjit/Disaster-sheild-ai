import { Router } from 'express';
import {
  handleChatMessage,
  getChatSession,
  clearChatSession,
  getChatMetrics,
} from '../controllers/chat.controller.js';
import { chatRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// POST /api/chat/message -> Process disaster & emergency query with rate limiting
router.post('/message', chatRateLimiter, handleChatMessage);

// GET /api/chat/session/:sessionId -> Retrieve conversation history
router.get('/session/:sessionId', getChatSession);

// DELETE /api/chat/session/:sessionId -> Clear conversation history
router.delete('/session/:sessionId', clearChatSession);

// GET /api/chat/metrics -> Telemetry and cache hit statistics
router.get('/metrics', getChatMetrics);

export default router;
