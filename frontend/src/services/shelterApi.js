import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Fetch nearby emergency shelters from backend Overpass + Fallback registry
 * @param {Object} params - { lat, lng, radius, disasterType }
 * @returns {Promise<Object>}
 */
export const fetchShelters = async ({ lat, lng, radius = 30000, disasterType = 'general' }) => {
  const params = {};
  if (lat !== undefined && lat !== null) params.lat = lat;
  if (lng !== undefined && lng !== null) params.lng = lng;
  if (radius !== undefined && radius !== null) params.radius = radius;
  if (disasterType) params.disasterType = disasterType;

  const response = await axios.get(`${API_BASE_URL}/shelters`, {
    params,
    timeout: 15000,
  });

  return response.data;
};

/**
 * Fetch AI recommended emergency shelter
 * @param {Object} params - { lat, lng, disasterLat, disasterLng, radius, disasterType }
 * @returns {Promise<Object>}
 */
export const fetchRecommendedShelter = async ({
  lat,
  lng,
  disasterLat,
  disasterLng,
  radius = 30000,
  disasterType = 'general',
}) => {
  if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) {
    throw new Error('Valid coordinates are required for shelter recommendation.');
  }

  const params = {
    lat,
    lng,
    radius,
    disasterType,
  };
  if (disasterLat != null && !isNaN(disasterLat)) params.disasterLat = disasterLat;
  if (disasterLng != null && !isNaN(disasterLng)) params.disasterLng = disasterLng;

  const response = await axios.get(`${API_BASE_URL}/shelters/recommended`, {
    params,
    timeout: 15000,
  });

  return response.data;
};

/**
 * Fetch aggregate shelter dashboard statistics
 * @returns {Promise<Object>}
 */
export const fetchShelterStats = async () => {
  const response = await axios.get(`${API_BASE_URL}/shelters/stats`, {
    timeout: 10000,
  });
  return response.data;
};

/**
 * Fetch single shelter details by ID
 * @param {string} id
 * @returns {Promise<Object>}
 */
export const fetchShelterById = async (id) => {
  if (!id) throw new Error('Shelter ID is required.');
  const response = await axios.get(`${API_BASE_URL}/shelters/${id}`, {
    timeout: 10000,
  });
  return response.data;
};

export default {
  fetchShelters,
  fetchRecommendedShelter,
  fetchShelterStats,
  fetchShelterById,
};
