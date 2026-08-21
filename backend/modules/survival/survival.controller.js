import survivalService from './survival.service.js';
import { wrapAsync } from '../../utils/wrapAsync.js';

/**
 * @desc    Get all survival content (with filtering, search, pagination, sort)
 * @route   GET /api/survival
 * @access  Public
 */
export const getAllSurvivalContent = wrapAsync(async (req, res) => {
  const result = await survivalService.getAllContent(req.query);
  res.status(200).json({
    success: true,
    data: result.items,
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    },
  });
});

/**
 * @desc    Get trending survival content (highest views)
 * @route   GET /api/survival/trending
 * @access  Public
 */
export const getTrendingContent = wrapAsync(async (req, res) => {
  const limit = req.query.limit || 6;
  const result = await survivalService.getTrendingContent(limit);
  res.status(200).json({
    success: true,
    count: result.items.length,
    data: result.items,
  });
});

/**
 * @desc    Get featured survival content
 * @route   GET /api/survival/featured
 * @access  Public
 */
export const getFeaturedContent = wrapAsync(async (req, res) => {
  const limit = req.query.limit || 6;
  const result = await survivalService.getFeaturedContent(limit);
  res.status(200).json({
    success: true,
    count: result.items.length,
    data: result.items,
  });
});

/**
 * @desc    Get auto survival recommendations for active disaster
 * @route   GET /api/survival/recommendations
 * @access  Public
 * @query   disasterType, type
 */
export const getDisasterRecommendations = wrapAsync(async (req, res) => {
  const disasterType = req.query.disasterType || req.query.type || 'general';
  const data = await survivalService.getDisasterRecommendations(disasterType);
  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * @desc    Get emergency quick guides & checklists
 * @route   GET /api/survival/guides
 * @access  Public
 */
export const getEmergencyQuickGuides = wrapAsync(async (req, res) => {
  const data = await survivalService.getEmergencyQuickGuides();
  res.status(200).json({
    success: true,
    count: data.length,
    data,
  });
});

/**
 * @desc    Get survival categories and statistics
 * @route   GET /api/survival/categories
 * @access  Public
 */
export const getCategoryMetrics = wrapAsync(async (req, res) => {
  const data = await survivalService.getCategoryMetrics();
  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * @desc    Get survival content for a specific disaster type
 * @route   GET /api/survival/disaster/:type
 * @access  Public
 */
export const getContentByDisasterType = wrapAsync(async (req, res) => {
  const { type } = req.params;
  const limit = req.query.limit || 12;
  const result = await survivalService.getContentByDisasterType(type, limit);
  res.status(200).json({
    success: true,
    disasterType: type,
    count: result.items.length,
    data: result.items,
  });
});

/**
 * @desc    Get single survival content by ID (increments views)
 * @route   GET /api/survival/:id
 * @access  Public
 */
export const getSurvivalContentById = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const content = await survivalService.getContentById(id, true);
  res.status(200).json({
    success: true,
    data: content,
  });
});

/**
 * @desc    Admin upload new survival content
 * @route   POST /api/survival
 * @access  Admin / Public
 */
export const createSurvivalContent = wrapAsync(async (req, res) => {
  const content = await survivalService.createContent(req.body);
  res.status(201).json({
    success: true,
    message: 'Survival content published successfully.',
    data: content,
  });
});

/**
 * @desc    Update survival content by ID
 * @route   PUT /api/survival/:id
 * @access  Admin
 */
export const updateSurvivalContent = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const updated = await survivalService.updateContent(id, req.body);
  res.status(200).json({
    success: true,
    message: 'Survival content updated successfully.',
    data: updated,
  });
});

/**
 * @desc    Delete survival content by ID
 * @route   DELETE /api/survival/:id
 * @access  Admin
 */
export const deleteSurvivalContent = wrapAsync(async (req, res) => {
  const { id } = req.params;
  await survivalService.deleteContent(id);
  res.status(200).json({
    success: true,
    message: 'Survival content deleted successfully.',
  });
});

/**
 * @desc    Like survival content
 * @route   POST /api/survival/:id/like
 * @access  Public
 */
export const likeSurvivalContent = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const content = await survivalService.likeContent(id);
  res.status(200).json({
    success: true,
    likes: content.likes,
  });
});

export default {
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
};
