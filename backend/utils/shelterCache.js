import NodeCache from 'node-cache';

/**
 * NodeCache instance for Emergency Shelter results
 * Standard TTL: 30 minutes (1800 seconds)
 * Check period: 2 minutes for expired key cleanup
 */
export const shelterNodeCache = new NodeCache({
  stdTTL: 1800, // 30 minutes TTL
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false,
});

/**
 * Generate normalized cache key based on coordinates and radius
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radius - Search radius (meters or km)
 * @returns {string} Normalized cache key
 */
export const generateShelterCacheKey = (lat, lng, radius) => {
  const roundLat = Number(lat).toFixed(3);
  const roundLng = Number(lng).toFixed(3);
  const roundRadius = Math.round(Number(radius));
  return `shelters_${roundLat}_${roundLng}_${roundRadius}`;
};

/**
 * Retrieve cached shelter data
 * @param {string} key
 * @returns {Array|null}
 */
export const getCachedShelters = (key) => {
  return shelterNodeCache.get(key) || null;
};

/**
 * Store shelter data in cache with 30-min TTL
 * @param {string} key
 * @param {*} data
 * @param {number} [ttlSeconds=1800]
 */
export const setCachedShelters = (key, data, ttlSeconds = 1800) => {
  shelterNodeCache.set(key, data, ttlSeconds);
  return data;
};

export default shelterNodeCache;
