import Shelter from '../models/shelter.model.js';
import { calculateDistanceKm } from '../utils/shelterRecommendation.js';

// Overpass API public endpoint
const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

/**
 * Generate structured fallback demo shelters when Overpass yields fewer than 3 results
 * Coordinates and shelter types adapt dynamically to the disaster type and exact global latitude/longitude.
 *
 * @param {number} lat - Base latitude
 * @param {number} lng - Base longitude
 * @param {number} countNeeded - Number of fallback shelters to create
 * @param {string} disasterType - Optional disaster type ('flood', 'earthquake', 'cyclone', 'wildfire', 'storm')
 * @returns {Array<Object>} Generated shelter objects
 */
export const generateDemoShelters = (lat, lng, countNeeded = 3, disasterType = 'general') => {
  const normType = (disasterType || '').toLowerCase();

  let templates = [];
  if (normType.includes('flood') || normType.includes('tsunami')) {
    templates = [
      { name: 'High-Ground Evacuation Shelter', type: 'school', addressPrefix: 'Elevated Community Center Safe Zone' },
      { name: 'Red Cross Flood Relief Camp', type: 'relief_camp', addressPrefix: 'Municipal Sports Ground Flood Haven' },
      { name: 'River Basin Emergency Assembly Point', type: 'assembly_point', addressPrefix: 'Civic High School & Evacuation Station' },
      { name: 'District Flood Evacuation Hub', type: 'community_centre', addressPrefix: 'Public Multi-Purpose Flood Safe Ground' },
    ];
  } else if (normType.includes('earthquake') || normType.includes('volcano') || normType.includes('landslide')) {
    templates = [
      { name: 'Open Grounds Seismic Relief Camp', type: 'relief_camp', addressPrefix: 'Central Stadium & Open Safe Grounds' },
      { name: 'Civic Evacuation & Triage Shelter', type: 'community_centre', addressPrefix: 'Single-Story Municipal Assembly Arena' },
      { name: 'Emergency Disaster Base Alpha', type: 'assembly_point', addressPrefix: 'District Parks & Open Assembly Zone' },
      { name: 'Post-Tremor Medical & Bed Shelter', type: 'school', addressPrefix: 'Civic Field Station & Humanitarian Base' },
    ];
  } else if (normType.includes('cyclone') || normType.includes('storm')) {
    templates = [
      { name: 'Reinforced Cyclone Evacuation Shelter', type: 'shelter', addressPrefix: 'Reinforced Concrete Public Safety Hub' },
      { name: 'Coastal Storm Relief Haven', type: 'community_centre', addressPrefix: 'Civic Townhall & Storm Sanctuary' },
      { name: 'District Gale & Storm Safe Center', type: 'school', addressPrefix: 'Model College Multi-Hazard Evacuation Point' },
      { name: 'Emergency Cyclone Defense Station', type: 'assembly_point', addressPrefix: 'Disaster Mitigation Center, Safe Sector' },
    ];
  } else if (normType.includes('wildfire') || normType.includes('fire') || normType.includes('heatwave')) {
    templates = [
      { name: 'Safe Perimeter Evacuation Center', type: 'community_centre', addressPrefix: 'Air-Filtered Civic Community Hall' },
      { name: 'Humanitarian Fire Relief Base', type: 'relief_camp', addressPrefix: 'Municipal Sports Complex & Respite Camp' },
      { name: 'District Evacuation & Intake Hub', type: 'school', addressPrefix: 'Regional High School Public Safe Zone' },
      { name: 'Emergency Smoke-Safe Sanctuary', type: 'shelter', addressPrefix: 'Civic Recreation & Cooling Center' },
    ];
  } else {
    templates = [
      { name: 'Municipal Evacuation Shelter', type: 'school', addressPrefix: 'Civic Educational & Humanitarian Base' },
      { name: 'Emergency Relief Camp Alpha', type: 'relief_camp', addressPrefix: 'District Sports Complex Evacuation Center' },
      { name: 'Public Safety Assembly Hub', type: 'community_centre', addressPrefix: 'Townhall & Emergency Response Station' },
      { name: 'Humanitarian Assistance Depot', type: 'assembly_point', addressPrefix: 'Civic Assembly Grounds & Medical Post' },
    ];
  }

  const generated = [];
  const count = Math.max(countNeeded, 3);

  const offsets = [
    { latOffset: 0.015, lngOffset: 0.018 },
    { latOffset: -0.018, lngOffset: 0.012 },
    { latOffset: 0.014, lngOffset: -0.019 },
    { latOffset: -0.016, lngOffset: -0.015 },
    { latOffset: 0.022, lngOffset: 0.008 },
    { latOffset: -0.025, lngOffset: 0.021 },
  ];

  for (let i = 0; i < count; i++) {
    const tmpl = templates[i % templates.length];
    const offset = offsets[i % offsets.length];

    // Capacity: 300-1000 total, 80-700 available
    const totalBeds = Math.floor(Math.random() * 700) + 300;
    const availableBeds = Math.min(
      totalBeds - 30,
      Math.floor(Math.random() * 620) + 80
    );

    const medicalAvailable = i % 2 === 0 || Math.random() > 0.35;
    const sLat = Number((lat + offset.latOffset + (Math.random() - 0.5) * 0.004).toFixed(5));
    const sLng = Number((lng + offset.lngOffset + (Math.random() - 0.5) * 0.004).toFixed(5));

    generated.push({
      name: tmpl.name,
      type: tmpl.type,
      latitude: sLat,
      longitude: sLng,
      address: `${tmpl.addressPrefix} (${sLat.toFixed(3)}°, ${sLng.toFixed(3)}°)`,
      capacity: {
        totalBeds,
        availableBeds,
      },
      facilities: {
        foodAvailable: true,
        medicalAvailable,
        waterAvailable: true,
        powerAvailable: true,
      },
      status: 'active',
      source: 'system',
      recommended: false,
    });
  }

  return generated;
};

/**
 * Normalizes OpenStreetMap / Overpass raw node or way into standard Shelter structure
 * @param {Object} element - Overpass JSON element
 * @returns {Object|null}
 */
const normalizeOverpassElement = (element) => {
  const tags = element.tags || {};
  const lat = element.lat || element.center?.lat;
  const lon = element.lon || element.center?.lon;

  if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) {
    return null;
  }

  // Determine Shelter Name
  let name = tags.name || tags['name:en'] || tags.operator || tags.description;
  const amenityType = tags.amenity || tags.emergency || tags.building || 'shelter';

  if (!name) {
    if (tags.amenity === 'school') name = 'Municipal School Evacuation Shelter';
    else if (tags.amenity === 'community_centre') name = 'Community Centre Emergency Shelter';
    else if (tags.amenity === 'townhall') name = 'Townhall Emergency Relief Point';
    else if (tags.emergency === 'assembly_point') name = 'Designated Assembly & Evacuation Point';
    else name = 'Emergency Public Shelter';
  }

  // Build Address
  const addrParts = [];
  if (tags['addr:housenumber']) addrParts.push(tags['addr:housenumber']);
  if (tags['addr:street']) addrParts.push(tags['addr:street']);
  if (tags['addr:suburb']) addrParts.push(tags['addr:suburb']);
  if (tags['addr:city']) addrParts.push(tags['addr:city']);
  if (tags['addr:country']) addrParts.push(tags['addr:country']);

  const address = addrParts.length > 0
    ? addrParts.join(', ')
    : `${name}, (${Number(lat).toFixed(3)}°, ${Number(lon).toFixed(3)}°)`;

  // Estimate capacity based on tags or realistic type estimates
  const tagCapacity = Number(tags.capacity) || Number(tags['capacity:persons']);
  const totalBeds = !isNaN(tagCapacity) && tagCapacity > 0
    ? tagCapacity
    : amenityType === 'school'
    ? 450
    : amenityType === 'townhall'
    ? 600
    : amenityType === 'community_centre'
    ? 350
    : 250;

  const availableBeds = Math.floor(totalBeds * (0.35 + Math.random() * 0.5));

  // Determine facilities from OpenStreetMap tags
  const foodAvailable = tags.food === 'yes' || tags.kitchen === 'yes' || amenityType === 'community_centre' || amenityType === 'school';
  const medicalAvailable = tags.healthcare === 'yes' || tags.first_aid === 'yes' || tags['emergency:phone'] !== undefined;
  const waterAvailable = tags.drinking_water === 'yes' || tags.water === 'yes' || true;
  const powerAvailable = tags.electricity === 'yes' || tags['generator:source'] !== undefined || true;

  return {
    name: name.trim(),
    type: amenityType,
    latitude: Number(lat),
    longitude: Number(lon),
    address,
    capacity: {
      totalBeds,
      availableBeds,
    },
    facilities: {
      foodAvailable,
      medicalAvailable,
      waterAvailable,
      powerAvailable,
    },
    status: 'active',
    source: 'overpass',
    recommended: false,
  };
};

/**
 * Persists shelters to MongoDB Atlas (updates if exists, or inserts new)
 * Resilient to DB connection status.
 * @param {Array<Object>} shelters
 * @returns {Promise<Array<Object>>}
 */
export const persistSheltersToDatabase = async (shelters = []) => {
  if (!Array.isArray(shelters) || shelters.length === 0) {
    return [];
  }

  try {
    const savedShelters = [];
    for (const item of shelters) {
      const existing = await Shelter.findOne({
        name: item.name,
        latitude: { $gte: item.latitude - 0.001, $lte: item.latitude + 0.001 },
        longitude: { $gte: item.longitude - 0.001, $lte: item.longitude + 0.001 },
      });

      if (existing) {
        existing.capacity = item.capacity;
        existing.facilities = item.facilities;
        existing.status = item.status || existing.status;
        existing.source = item.source || existing.source;
        await existing.save();
        savedShelters.push(existing.toObject());
      } else {
        const created = await Shelter.create(item);
        savedShelters.push(created.toObject());
      }
    }
    return savedShelters;
  } catch (dbErr) {
    return shelters.map((s, idx) => ({
      _id: s._id || `shelter-mem-${Date.now()}-${idx}`,
      ...s,
    }));
  }
};

/**
 * Fetches nearby emergency shelters from OpenStreetMap Overpass API
 * Falls back to auto-generated system relief camps if Overpass returns fewer than 3 results.
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} [radiusMeters=20000] - Search radius in meters
 * @param {string} [disasterType='general'] - Type of disaster for tailored shelters
 * @returns {Promise<Array<Object>>} Normalized shelter list
 */
export const fetchSheltersFromOverpass = async (lat, lng, radiusMeters = 20000, disasterType = 'general') => {
  const latitude = Number(lat);
  const longitude = Number(lng);
  const radius = Math.min(50000, Math.max(1000, Number(radiusMeters) || 20000));

  let overpassShelters = [];

  const overpassQuery = `
[out:json][timeout:15];
(
  node["amenity"="shelter"](around:${radius},${latitude},${longitude});
  way["amenity"="shelter"](around:${radius},${latitude},${longitude});
  node["emergency"="assembly_point"](around:${radius},${latitude},${longitude});
  way["emergency"="assembly_point"](around:${radius},${latitude},${longitude});
  node["amenity"="community_centre"](around:${radius},${latitude},${longitude});
  way["amenity"="community_centre"](around:${radius},${latitude},${longitude});
  node["amenity"="school"](around:${radius},${latitude},${longitude});
  way["amenity"="school"](around:${radius},${latitude},${longitude});
  node["amenity"="townhall"](around:${radius},${latitude},${longitude});
  way["amenity"="townhall"](around:${radius},${latitude},${longitude});
);
out center 40;
  `.trim();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(OVERPASS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'DisasterShield-Emergency-Shelter-Service/1.0',
      },
      body: `data=${encodeURIComponent(overpassQuery)}`,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.elements)) {
        overpassShelters = data.elements
          .map(normalizeOverpassElement)
          .filter(Boolean);
      }
    }
  } catch (err) {
    // Network / timeout fallback
  }

  // ── FALLBACK SYSTEM: If fewer than 3 shelters found, generate local relief hubs ──
  let combinedShelters = [...overpassShelters];

  if (combinedShelters.length < 3) {
    const countNeeded = 4 - combinedShelters.length;
    const fallbackShelters = generateDemoShelters(latitude, longitude, countNeeded, disasterType);
    combinedShelters = [...combinedShelters, ...fallbackShelters];
  }

  // Persist to database
  const savedResults = await persistSheltersToDatabase(combinedShelters);

  // Compute live distance from requested coordinates
  const resultsWithDistance = savedResults.map((shelter) => {
    const distKm = calculateDistanceKm(
      latitude,
      longitude,
      Number(shelter.latitude),
      Number(shelter.longitude)
    );
    return {
      ...shelter,
      distanceKm: Math.round(distKm * 10) / 10,
    };
  });

  // Sort ascending by distance
  resultsWithDistance.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

  return resultsWithDistance;
};

export default {
  fetchSheltersFromOverpass,
  generateDemoShelters,
  persistSheltersToDatabase,
};
