import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Login rescue team by team code or credentials
 */
export const loginRescueTeam = async (credentials) => {
  const res = await axios.post(`${API_BASE_URL}/rescue/login`, credentials);
  return res.data;
};

/**
 * Register a new rescue team
 */
export const registerRescueTeam = async (teamData) => {
  const res = await axios.post(`${API_BASE_URL}/rescue/register`, teamData);
  return res.data;
};

/**
 * Fetch all rescue teams
 */
export const fetchRescueTeams = async () => {
  const res = await axios.get(`${API_BASE_URL}/rescue/teams`);
  return res.data;
};

/**
 * Fetch specific rescue team by ID
 */
export const fetchRescueTeamById = async (teamId) => {
  const res = await axios.get(`${API_BASE_URL}/rescue/teams/${encodeURIComponent(teamId)}`);
  return res.data;
};

/**
 * Update rescue team operational status or location
 */
export const updateRescueTeamStatus = async (teamId, updateData) => {
  const res = await axios.put(
    `${API_BASE_URL}/rescue/teams/${encodeURIComponent(teamId)}/status`,
    updateData
  );
  return res.data;
};

/**
 * Fetch dynamic location-based prioritized rescue missions
 */
export const fetchPrioritizedRescues = async ({
  latitude,
  longitude,
  specialization = 'general_sar',
  radius = 5000,
  teamId,
}) => {
  const params = {
    latitude,
    longitude,
    specialization,
    radius,
    ...(teamId && { teamId }),
  };
  const res = await axios.get(`${API_BASE_URL}/rescue/prioritize`, { params });
  return res.data;
};

/**
 * Execute mission action (accept, on_scene, complete, update rescued count)
 */
export const sendMissionAction = async (actionPayload) => {
  const res = await axios.post(`${API_BASE_URL}/rescue/mission/action`, actionPayload);
  return res.data;
};

/**
 * Fetch all active SOS distress alerts
 */
export const fetchAllSOS = async (params = {}) => {
  const res = await axios.get(`${API_BASE_URL}/sos`, { params });
  return res.data;
};

/**
 * Create new SOS distress alert
 */
export const createSOSAlert = async (sosData) => {
  const res = await axios.post(`${API_BASE_URL}/sos`, sosData);
  return res.data;
};

/**
 * Update SOS status or assigned team
 */
export const updateSOSAlert = async (sosId, updateData) => {
  const res = await axios.put(`${API_BASE_URL}/sos/${encodeURIComponent(sosId)}`, updateData);
  return res.data;
};

export default {
  loginRescueTeam,
  registerRescueTeam,
  fetchRescueTeams,
  fetchRescueTeamById,
  updateRescueTeamStatus,
  fetchPrioritizedRescues,
  sendMissionAction,
  fetchAllSOS,
  createSOSAlert,
  updateSOSAlert,
};
