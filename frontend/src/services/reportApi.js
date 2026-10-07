import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const submitIncidentReport = async (payload) => {
  const response = await apiClient.post('/reports', payload);
  return response.data;
};

export const fetchIncidentReports = async (params = {}) => {
  const response = await apiClient.get('/reports', { params });
  return response.data;
};

export default {
  submitIncidentReport,
  fetchIncidentReports,
};
