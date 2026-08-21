import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Fetch all survival educational content with filters, search, sorting, and pagination
 */
export const fetchSurvivalContent = async (params = {}) => {
  const response = await axios.get(`${API_BASE_URL}/survival`, {
    params,
    timeout: 12000,
  });
  return response.data;
};

/**
 * Fetch trending survival content
 */
export const fetchTrendingSurvival = async (limit = 6) => {
  const response = await axios.get(`${API_BASE_URL}/survival/trending`, {
    params: { limit },
    timeout: 10000,
  });
  return response.data;
};

/**
 * Fetch featured survival content
 */
export const fetchFeaturedSurvival = async (limit = 6) => {
  const response = await axios.get(`${API_BASE_URL}/survival/featured`, {
    params: { limit },
    timeout: 10000,
  });
  return response.data;
};

/**
 * Fetch auto-recommendations and emergency guide for a disaster type
 */
export const fetchDisasterRecommendations = async (disasterType = 'general') => {
  const response = await axios.get(`${API_BASE_URL}/survival/recommendations`, {
    params: { disasterType },
    timeout: 12000,
  });
  return response.data;
};

/**
 * Fetch emergency quick guides and checklists
 */
export const fetchEmergencyQuickGuides = async () => {
  const response = await axios.get(`${API_BASE_URL}/survival/guides`, {
    timeout: 10000,
  });
  return response.data;
};

/**
 * Fetch categories and count metrics
 */
export const fetchSurvivalCategories = async () => {
  const response = await axios.get(`${API_BASE_URL}/survival/categories`, {
    timeout: 10000,
  });
  return response.data;
};

/**
 * Fetch single survival content by ID (increments views)
 */
export const fetchSurvivalById = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/survival/${id}`, {
    timeout: 10000,
  });
  return response.data;
};

/**
 * Create/publish new survival content
 */
export const createSurvivalContent = async (contentData) => {
  const response = await axios.post(`${API_BASE_URL}/survival`, contentData, {
    timeout: 12000,
  });
  return response.data;
};

/**
 * Update survival content by ID
 */
export const updateSurvivalContent = async (id, updateData) => {
  const response = await axios.put(`${API_BASE_URL}/survival/${id}`, updateData, {
    timeout: 12000,
  });
  return response.data;
};

/**
 * Delete survival content by ID
 */
export const deleteSurvivalContent = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/survival/${id}`, {
    timeout: 10000,
  });
  return response.data;
};

/**
 * Like survival content
 */
export const likeSurvivalContent = async (id) => {
  const response = await axios.post(`${API_BASE_URL}/survival/${id}/like`, {}, {
    timeout: 10000,
  });
  return response.data;
};

export default {
  fetchSurvivalContent,
  fetchTrendingSurvival,
  fetchFeaturedSurvival,
  fetchDisasterRecommendations,
  fetchEmergencyQuickGuides,
  fetchSurvivalCategories,
  fetchSurvivalById,
  createSurvivalContent,
  updateSurvivalContent,
  deleteSurvivalContent,
  likeSurvivalContent,
};
