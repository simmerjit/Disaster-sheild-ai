import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Facility type configurations and display labels
 */
export const FACILITY_TYPES = [
  { id: 'hospital', label: 'Hospitals', emoji: '🏥', color: '#ef4444' },
  { id: 'medical_center', label: 'Medical Centers', emoji: '🚑', color: '#3b82f6' },
  { id: 'pharmacy', label: 'Pharmacies', emoji: '💊', color: '#10b981' },
  { id: 'police', label: 'Police Stations', emoji: '🚓', color: '#6366f1' },
  { id: 'fire_station', label: 'Fire Stations', emoji: '🚒', color: '#f97316' },
  { id: 'clinic', label: 'Clinics', emoji: '🩺', color: '#06b6d4' },
];

/**
 * Fetch nearby emergency facilities from backend Google Places API integration
 * @param {Object} params - { latitude, longitude, radius, type }
 * @returns {Promise<Object>} Normalized emergency facilities response
 */
export const fetchNearbyFacilities = async ({
  latitude,
  longitude,
  radius = 5000,
  type = 'hospital',
}) => {
  if (latitude === null || longitude === null || isNaN(latitude) || isNaN(longitude)) {
    throw new Error('Valid coordinates are required to search nearby emergency facilities.');
  }

  const response = await axios.get(`${API_BASE_URL}/places/nearby`, {
    params: {
      latitude,
      longitude,
      radius,
      type,
    },
    timeout: 15000,
  });

  return response.data;
};

export default {
  fetchNearbyFacilities,
  FACILITY_TYPES,
};
