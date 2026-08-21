import express from 'express';
import {
  getAllSurvivalContent,
  getTrendingContent,
  getFeaturedContent,
  getDisasterRecommendations,
  getEmergencyQuickGuides,
  getCategoryMetrics,
  getContentByDisasterType,
  getSurvivalContentById,
  createSurvivalContent,
  updateSurvivalContent,
  deleteSurvivalContent,
  likeSurvivalContent,
} from './survival.controller.js';

const router = express.Router();

// Specific and parameterized sub-routes
router.get('/trending', getTrendingContent);
router.get('/featured', getFeaturedContent);
router.get('/recommendations', getDisasterRecommendations);
router.get('/guides', getEmergencyQuickGuides);
router.get('/categories', getCategoryMetrics);
router.get('/disaster/:type', getContentByDisasterType);

// Main resource collection & single item routes
router.route('/')
  .get(getAllSurvivalContent)
  .post(createSurvivalContent);

router.route('/:id')
  .get(getSurvivalContentById)
  .put(updateSurvivalContent)
  .delete(deleteSurvivalContent);

router.post('/:id/like', likeSurvivalContent);

export default router;
