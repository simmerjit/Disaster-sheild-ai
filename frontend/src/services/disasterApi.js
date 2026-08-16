import axios from 'axios';

// Backend API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch all aggregated live & database disaster data from Express backend
 * @param {Object} params - Query parameters (type, severity, limit)
 * @returns {Promise<Array>} Array of normalized disaster objects
 */
export const fetchAllDisasters = async (params = {}) => {
  const response = await apiClient.get('/disasters', { params });
  return response.data;
};

/**
 * Fetch live disasters from GDACS feed via backend
 */
export const fetchGdacsDisasters = async (params = {}) => {
  const response = await apiClient.get('/disasters/live', { params });
  return response.data;
};

/**
 * Fetch live earthquakes from USGS GeoJSON feed via backend
 */
export const fetchUsgsEarthquakes = async (params = {}) => {
  const response = await apiClient.get('/disasters/earthquakes', { params });
  return response.data;
};

/**
 * Fetch live natural events from NASA EONET via backend
 */
export const fetchNasaEvents = async (params = {}) => {
  const response = await apiClient.get('/disasters/nasa', { params });
  return response.data;
};

export default apiClient;
