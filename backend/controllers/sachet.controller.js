import { XMLParser } from 'fast-xml-parser';

// In-memory cache for SACHET feed
let sachetCache = {
  data: null,
  timestamp: 0,
};
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

const SACHET_FEED_URL =
  process.env.SACHET_FEED_URL ||
  'https://sachet.ndma.gov.in/cap_public_website/rss/rss_india.xml';

// XML Parser instance
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: true,
  trimValues: true,
});

/**
 * Centroid coordinate lookup for prominent Indian districts and states
 * Used as fallback if CAP XML doesn't contain explicit circle or polygon coordinates
 */
const INDIAN_LOCATIONS_MAP = {
  // Odisha
  baleshwar: { lat: 21.4934, lng: 86.9338 },
  balasore: { lat: 21.4934, lng: 86.9338 },
  mayurbhanj: { lat: 21.9284, lng: 86.4387 },
  sundargarh: { lat: 22.1197, lng: 84.0375 },
  bhubaneswar: { lat: 20.2961, lng: 85.8245 },
  cuttack: { lat: 20.4625, lng: 85.8828 },
  puri: { lat: 19.8135, lng: 85.8312 },
  ganjam: { lat: 19.3813, lng: 84.9877 },
  bhadrak: { lat: 21.0544, lng: 86.4952 },
  kendrapara: { lat: 20.5015, lng: 86.4225 },
  jagatsinghpur: { lat: 20.2588, lng: 86.1724 },
  koraput: { lat: 18.8135, lng: 82.7123 },

  // Maharashtra
  beed: { lat: 18.9891, lng: 75.7601 },
  'chhatrapati sambhajinagar': { lat: 19.8762, lng: 75.3433 },
  aurangabad: { lat: 19.8762, lng: 75.3433 },
  dharashiv: { lat: 18.1856, lng: 76.0416 },
  osmanabad: { lat: 18.1856, lng: 76.0416 },
  dhule: { lat: 20.9042, lng: 74.7749 },
  hingoli: { lat: 19.7196, lng: 77.1481 },
  jalgaon: { lat: 21.0077, lng: 75.5626 },
  jalna: { lat: 19.8410, lng: 75.8864 },
  latur: { lat: 18.4088, lng: 76.5604 },
  nanded: { lat: 19.1383, lng: 77.3210 },
  nashik: { lat: 19.9975, lng: 73.7898 },
  parbhani: { lat: 19.2608, lng: 76.7748 },
  mumbai: { lat: 19.0760, lng: 72.8777 },
  pune: { lat: 18.5204, lng: 73.8567 },
  nagpur: { lat: 21.1458, lng: 79.0882 },
  thane: { lat: 19.2183, lng: 72.9781 },
  palghar: { lat: 19.6967, lng: 72.7699 },
  raigad: { lat: 18.5158, lng: 73.1812 },
  ratnagiri: { lat: 16.9902, lng: 73.3120 },
  sindhudurg: { lat: 16.1118, lng: 73.7027 },
  kolhapur: { lat: 16.7050, lng: 74.2433 },
  satara: { lat: 17.6805, lng: 74.0183 },
  solapur: { lat: 17.6599, lng: 75.9064 },
  sangli: { lat: 16.8524, lng: 74.5815 },
  amravati: { lat: 20.9374, lng: 77.7796 },
  akola: { lat: 20.7002, lng: 77.0082 },
  buldhana: { lat: 20.5293, lng: 76.1843 },
  washim: { lat: 20.1110, lng: 77.1332 },
  yavatmal: { lat: 20.3888, lng: 78.1204 },
  wardha: { lat: 20.7453, lng: 78.6022 },
  chandrapur: { lat: 19.9615, lng: 79.2961 },
  gadchiroli: { lat: 20.1849, lng: 80.0035 },
  bhandara: { lat: 21.1713, lng: 79.6548 },
  gondia: { lat: 21.4598, lng: 80.1961 },

  // West Bengal
  kolkata: { lat: 22.5726, lng: 88.3639 },
  'north 24 parganas': { lat: 22.7230, lng: 88.4807 },
  'south 24 parganas': { lat: 22.1643, lng: 88.4334 },
  howrah: { lat: 22.5958, lng: 88.2636 },
  hooghly: { lat: 22.9031, lng: 88.3968 },
  purba_medinipur: { lat: 21.9497, lng: 87.7758 },
  digha: { lat: 21.6266, lng: 87.5074 },
  paschim_medinipur: { lat: 22.4257, lng: 87.3199 },
  darjeeling: { lat: 27.0410, lng: 88.2663 },
  jalpaiguri: { lat: 26.5414, lng: 88.7196 },
  alipurduar: { lat: 26.4919, lng: 89.5271 },
  cooch_behar: { lat: 26.3236, lng: 89.4510 },
  malda: { lat: 25.0108, lng: 88.1411 },
  murshidabad: { lat: 24.1759, lng: 88.2802 },
  nadia: { lat: 23.4710, lng: 88.5565 },
  birbhum: { lat: 23.9408, lng: 87.6582 },
  bankura: { lat: 23.2324, lng: 87.0715 },
  purulia: { lat: 23.3321, lng: 86.3652 },

  // Tamil Nadu & Kerala
  chennai: { lat: 13.0827, lng: 80.2707 },
  coimbatore: { lat: 11.0168, lng: 76.9558 },
  madurai: { lat: 9.9252, lng: 78.1198 },
  kanyakumari: { lat: 8.0883, lng: 77.5385 },
  thiruvananthapuram: { lat: 8.5241, lng: 76.9366 },
  kochi: { lat: 9.9312, lng: 76.2673 },
  wayanad: { lat: 11.6854, lng: 76.1320 },
  kozhikode: { lat: 11.2588, lng: 75.7804 },
  idukki: { lat: 9.8494, lng: 76.9804 },

  // North India & Capital
  delhi: { lat: 28.6139, lng: 77.2090 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
  patna: { lat: 25.5941, lng: 85.1376 },
  shimla: { lat: 31.1048, lng: 77.1734 },
  dehradun: { lat: 30.3165, lng: 78.0322 },
  srinagar: { lat: 34.0837, lng: 74.7973 },
  jammu: { lat: 32.7266, lng: 74.8570 },
  chandigarh: { lat: 30.7333, lng: 76.7794 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  bhopal: { lat: 23.2599, lng: 77.4126 },
  raipur: { lat: 21.2514, lng: 81.6296 },
  ranchi: { lat: 23.3441, lng: 85.3096 },
  guwahati: { lat: 26.1445, lng: 91.7362 },
  imphal: { lat: 24.8170, lng: 93.9368 },
  shillong: { lat: 25.5788, lng: 91.8933 },
  aizawl: { lat: 23.7271, lng: 92.7176 },
  kohima: { lat: 25.6751, lng: 94.1086 },
  agartala: { lat: 23.8315, lng: 91.2868 },
  gangtok: { lat: 27.3389, lng: 88.6065 },
  itanagar: { lat: 27.0844, lng: 93.6053 },
  port_blair: { lat: 11.6234, lng: 92.7265 },
};

/**
 * Normalizes event text to standard disaster types
 * @param {string} text
 * @returns {string}
 */
export const mapSachetDisasterType = (text = '') => {
  const t = text.toLowerCase();
  if (t.includes('earthquake') || t.includes('quake') || t.includes('tremor') || t.includes('seismic')) {
    return 'earthquake';
  }
  if (t.includes('cyclone') || t.includes('depression') || t.includes('hurricane') || t.includes('typhoon')) {
    return 'cyclone';
  }
  if (
    t.includes('flood') ||
    t.includes('inundation') ||
    t.includes('waterlogging') ||
    t.includes('rain') ||
    t.includes('rainfall') ||
    t.includes('heavy precipitation')
  ) {
    return 'flood';
  }
  if (t.includes('wildfire') || t.includes('forest fire') || t.includes('fire')) {
    return 'wildfire';
  }
  if (t.includes('volcano') || t.includes('eruption') || t.includes('ash')) {
    return 'volcano';
  }
  if (t.includes('drought') || t.includes('heat wave') || t.includes('heatwave') || t.includes('cold wave')) {
    return 'drought';
  }
  if (t.includes('tsunami')) {
    return 'tsunami';
  }
  if (
    t.includes('thunderstorm') ||
    t.includes('lightning') ||
    t.includes('storm') ||
    t.includes('squall') ||
    t.includes('gale') ||
    t.includes('gusty wind') ||
    t.includes('hailstorm')
  ) {
    return 'storm';
  }
  if (t.includes('landslide') || t.includes('mudslide') || t.includes('rockfall') || t.includes('avalanche')) {
    return 'landslide';
  }
  return 'other';
};

/**
 * Maps CAP severity strings to our system
 * @param {string} capSeverity
 * @returns {string}
 */
export const mapSachetSeverity = (capSeverity = '') => {
  const s = String(capSeverity).toLowerCase();
  if (s === 'extreme') return 'critical';
  if (s === 'severe') return 'high';
  if (s === 'moderate') return 'medium';
  if (s === 'minor') return 'low';
  return 'unknown';
};

/**
 * Extracts coordinates from CAP geometry (circle, polygon, geocode, or text lookup)
 * @param {Object} capInfo
 * @param {string} textContext
 */
export const extractCoordinates = (capInfo = {}, textContext = '') => {
  let lat = null;
  let lng = null;
  let affectedRadius = 15;

  const area = capInfo.area || capInfo['cap:area'] || {};

  // 1. Check CAP Circle (format: "lat,long radius_in_km")
  const circle = area.circle || area['cap:circle'];
  if (circle && typeof circle === 'string') {
    const parts = circle.trim().split(/\s+/);
    if (parts[0] && parts[0].includes(',')) {
      const [cLat, cLng] = parts[0].split(',');
      const parsedLat = parseFloat(cLat);
      const parsedLng = parseFloat(cLng);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        lat = parsedLat;
        lng = parsedLng;
      }
      if (parts[1]) {
        const parsedRad = parseFloat(parts[1]);
        if (!isNaN(parsedRad) && parsedRad > 0) {
          affectedRadius = parsedRad;
        }
      }
    }
  }

  // 2. Check CAP Polygon (format: "lat1,long1 lat2,long2 ...")
  const polygon = area.polygon || area['cap:polygon'];
  if (!lat && polygon && typeof polygon === 'string') {
    const points = polygon.trim().split(/\s+/);
    let sumLat = 0;
    let sumLng = 0;
    let count = 0;
    for (const pt of points) {
      if (pt.includes(',')) {
        const [pLat, pLng] = pt.split(',');
        const p1 = parseFloat(pLat);
        const p2 = parseFloat(pLng);
        if (!isNaN(p1) && !isNaN(p2)) {
          sumLat += p1;
          sumLng += p2;
          count++;
        }
      }
    }
    if (count > 0) {
      lat = sumLat / count;
      lng = sumLng / count;
    }
  }

  // 3. Fallback: match known Indian district/state names in areaDesc, headline, or text context
  if (lat === null || lng === null) {
    const areaDesc = area.areaDesc || area['cap:areaDesc'] || '';
    const searchString = `${areaDesc} ${textContext}`.toLowerCase();

    for (const [name, coords] of Object.entries(INDIAN_LOCATIONS_MAP)) {
      // Check whole word boundary
      const regex = new RegExp(`\\b${name}\\b`, 'i');
      if (regex.test(searchString)) {
        lat = coords.lat;
        lng = coords.lng;
        break;
      }
    }
  }

  return {
    latitude: lat !== null && !isNaN(lat) ? lat : null,
    longitude: lng !== null && !isNaN(lng) ? lng : null,
    affectedRadius,
  };
};

/**
 * Normalizes a SACHET RSS item or CAP Alert into standard disaster format
 * @param {Object} item - RSS item object
 * @returns {Object|null}
 */
export const normalizeSachetAlert = (item) => {
  if (!item) return null;

  const rawTitle = item.title || item.headline || 'Official SACHET Alert';
  const rawDesc = item.description || item.instruction || '';
  const identifier = item.guid?.['#text'] || item.guid || item.identifier || String(Date.now());
  const link =
    item.link ||
    (identifier
      ? `https://sachet.ndma.gov.in/cap_public_website/FetchXMLFile?identifier=${encodeURIComponent(identifier)}`
      : 'https://sachet.ndma.gov.in');

  const rawCategory = item.category || 'Met';
  const type = mapSachetDisasterType(`${rawTitle} ${rawDesc} ${rawCategory}`);
  const severity = mapSachetSeverity(item.severity || 'Severe');

  // Extract date
  let timestamp = null;
  if (item.pubDate) {
    const d = new Date(item.pubDate);
    if (!isNaN(d.getTime())) timestamp = d.toISOString();
  } else if (item.sent) {
    const d = new Date(item.sent);
    if (!isNaN(d.getTime())) timestamp = d.toISOString();
  }
  if (!timestamp) timestamp = new Date().toISOString();

  // Extract coordinates
  const coords = extractCoordinates(item, `${rawTitle} ${rawDesc}`);

  // Location string
  let locationStr = 'India';
  if (item.areaDesc) {
    locationStr = item.areaDesc;
  } else if (item.author) {
    locationStr = item.author.replace(/controlroom@ndma\.gov\.in/i, '').replace(/[()]/g, '').trim() || 'India';
  }

  return {
    id: `sachet_${identifier}`,
    title: rawTitle,
    type,
    description: rawDesc || `Official weather and disaster warning issued by NDMA SACHET: ${rawTitle}`,
    severity,
    magnitude: null,
    depth: null,
    latitude: coords.latitude,
    longitude: coords.longitude,
    affectedRadius: coords.affectedRadius,
    country: 'India',
    location: locationStr,
    timestamp,
    source: 'SACHET',
    status: item.status?.toLowerCase() === 'draft' ? 'draft' : 'active',
    link,
    // Extra CAP metadata fields preserved for UI
    instruction: item.instruction || 'Please follow SDMA and local disaster authority safety guidelines.',
    urgency: item.urgency || 'Expected',
    certainty: item.certainty || 'Likely',
    effective: item.effective || timestamp,
    expires: item.expires || null,
    capIdentifier: identifier,
    sender: item.author || item.sender || 'NDMA / IMD',
  };
};

/**
 * Fetches and parses the official SACHET CAP / RSS XML feed
 * @returns {Promise<Array>}
 */
export const fetchSachetFeed = async () => {
  // Check in-memory cache
  const now = Date.now();
  if (sachetCache.data && now - sachetCache.timestamp < CACHE_TTL_MS) {
    return sachetCache.data;
  }

  const response = await fetch(SACHET_FEED_URL, {
    headers: {
      'User-Agent': 'DisasterShieldAI/1.0 (NDMA CAP Consumer; +https://github.com)',
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
    signal: AbortSignal.timeout(10000), // 10s timeout
  });

  if (!response.ok) {
    throw new Error(`SACHET feed server responded with HTTP status ${response.status}`);
  }

  const xmlText = await response.text();
  if (!xmlText || !xmlText.trim().startsWith('<')) {
    throw new Error('SACHET returned non-XML payload');
  }

  const parsed = xmlParser.parse(xmlText);
  const rawItems = parsed?.rss?.channel?.item || [];
  const itemsArray = Array.isArray(rawItems) ? rawItems : [rawItems];

  // Deduplicate by ID
  const alertMap = new Map();
  for (const rawItem of itemsArray) {
    const normalized = normalizeSachetAlert(rawItem);
    if (normalized && normalized.id && !alertMap.has(normalized.id)) {
      alertMap.set(normalized.id, normalized);
    }
  }

  const normalizedList = Array.from(alertMap.values());

  // Save to cache
  sachetCache = {
    data: normalizedList,
    timestamp: now,
  };

  return normalizedList;
};

/**
 * @desc    Get live disaster alerts from NDMA SACHET CAP / RSS Feed
 * @route   GET /api/disasters/sachet
 * @access  Public
 */
export const getSachetAlerts = async (req, res) => {
  try {
    const alerts = await fetchSachetFeed();

    res.status(200).json({
      success: true,
      count: alerts.length,
      source: 'SACHET',
      cached: Date.now() - sachetCache.timestamp < CACHE_TTL_MS,
      data: alerts,
    });
  } catch (error) {
    console.error('SACHET Feed Fetch Error:', error.message);

    // If cache has older data, fallback gracefully
    if (sachetCache.data && sachetCache.data.length > 0) {
      console.warn('Returning stale SACHET cache due to upstream error');
      return res.status(200).json({
        success: true,
        count: sachetCache.data.length,
        source: 'SACHET',
        cached: true,
        stale: true,
        data: sachetCache.data,
      });
    }

    res.status(503).json({
      success: false,
      source: 'SACHET',
      message: 'SACHET alerts are currently unavailable',
      error: error.message,
    });
  }
};

export default {
  getSachetAlerts,
  fetchSachetFeed,
  normalizeSachetAlert,
  mapSachetDisasterType,
  mapSachetSeverity,
  extractCoordinates,
};
