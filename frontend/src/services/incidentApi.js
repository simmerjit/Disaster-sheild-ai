import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Fetch impact and casualty statistics for a disaster
 * @param {string} disasterId
 */
export const fetchDisasterImpact = async (disasterId) => {
  if (!disasterId) return null;
  try {
    const res = await axios.get(`${API_BASE_URL}/disasters/${encodeURIComponent(disasterId)}/impact`, {
      timeout: 8000,
    });
    return res.data?.impact || null;
  } catch (err) {
    console.warn(`Could not load impact data for disaster ${disasterId}:`, err.message);
    return null;
  }
};

/**
 * Fetch verified updates / news feed for a disaster
 * @param {string} disasterId
 */
export const fetchDisasterUpdates = async (disasterId) => {
  if (!disasterId) return [];
  try {
    const res = await axios.get(`${API_BASE_URL}/disasters/${encodeURIComponent(disasterId)}/updates`, {
      timeout: 8000,
    });
    return res.data?.data || [];
  } catch (err) {
    console.warn(`Could not load updates for disaster ${disasterId}:`, err.message);
    return [];
  }
};

/**
 * Fetch rescue operations for a disaster
 * @param {string} disasterId
 */
export const fetchDisasterRescueOperations = async (disasterId) => {
  if (!disasterId) return [];
  try {
    const res = await axios.get(`${API_BASE_URL}/disasters/${encodeURIComponent(disasterId)}/rescue-operations`, {
      timeout: 8000,
    });
    return res.data?.data || [];
  } catch (err) {
    console.warn(`Could not load rescue operations for disaster ${disasterId}:`, err.message);
    return [];
  }
};

/**
 * Fetch nearby verified emergency shelters from MongoDB
 * @param {Object} params - { latitude, longitude, radius }
 */
export const fetchNearbyShelters = async ({ latitude, longitude, radius = 50 }) => {
  if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
    return [];
  }
  try {
    const res = await axios.get(`${API_BASE_URL}/shelters/nearby`, {
      params: { latitude, longitude, radius },
      timeout: 8000,
    });
    return res.data?.data || [];
  } catch (err) {
    console.warn('Could not load nearby shelters:', err.message);
    return [];
  }
};

/**
 * Fetch verified relief and donation organizations
 * @param {Object} params - { area, service, verified }
 */
export const fetchReliefOrganizations = async (params = {}) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/relief-organizations`, {
      params: {
        verified: params.verified !== undefined ? params.verified : true,
        area: params.area || undefined,
        service: params.service || undefined,
      },
      timeout: 8000,
    });
    return res.data?.data || [];
  } catch (err) {
    console.warn('Could not load relief organizations:', err.message);
    return [];
  }
};

/**
 * Aggregated helper to load all incident data in parallel for the disaster details panel
 * @param {Object} disaster
 */
export const fetchFullIncidentDetails = async (disaster) => {
  if (!disaster) return null;

  const disasterId = disaster.id || disaster._id;
  const lat = Number(disaster.latitude);
  const lng = Number(disaster.longitude);

  const [impact, updates, rescueOps, shelters, reliefOrgs] = await Promise.all([
    fetchDisasterImpact(disasterId),
    fetchDisasterUpdates(disasterId),
    fetchDisasterRescueOperations(disasterId),
    fetchNearbyShelters({ latitude: lat, longitude: lng, radius: 50 }),
    fetchReliefOrganizations({ area: disaster.country || disaster.location }),
  ]);

  return {
    disaster,
    impact,
    updates,
    rescueOps,
    shelters,
    reliefOrgs,
  };
};

export default {
  fetchDisasterImpact,
  fetchDisasterUpdates,
  fetchDisasterRescueOperations,
  fetchNearbyShelters,
  fetchReliefOrganizations,
  fetchFullIncidentDetails,
};
