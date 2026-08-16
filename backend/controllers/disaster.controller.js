import mongoose from 'mongoose';
import { XMLParser } from 'fast-xml-parser';
import Disaster from '../models/disaster.model.js';

// XML Parser instance for GDACS RSS feeds
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: true,
  trimValues: true,
});

// Helper: Map GDACS event types to standard types
const mapGdacsType = (eventType) => {
  const code = (eventType || '').toUpperCase();
  switch (code) {
    case 'EQ':
      return 'earthquake';
    case 'TC':
      return 'cyclone';
    case 'FL':
      return 'flood';
    case 'VO':
      return 'volcano';
    case 'DR':
      return 'drought';
    case 'WF':
      return 'wildfire';
    case 'TS':
      return 'tsunami';
    default:
      return 'other';
  }
};

// Helper: Map GDACS alert levels to severity
const mapGdacsSeverity = (alertLevel) => {
  const level = (alertLevel || '').toLowerCase();
  if (level === 'red') return 'critical';
  if (level === 'orange') return 'high';
  if (level === 'green') return 'low';
  return 'medium';
};

// Helper: Estimate affected radius in km based on type and severity
const calculateRadius = (type, severity, magnitude) => {
  if (type === 'earthquake') {
    const mag = Number(magnitude) || 4.5;
    if (mag >= 7.0) return 200;
    if (mag >= 5.5) return 80;
    if (mag >= 4.0) return 35;
    return 15;
  }
  if (type === 'cyclone' || type === 'storm') {
    if (severity === 'critical') return 300;
    if (severity === 'high') return 200;
    return 120;
  }
  if (type === 'flood') {
    if (severity === 'critical') return 100;
    if (severity === 'high') return 60;
    return 30;
  }
  if (type === 'wildfire') {
    return severity === 'critical' ? 50 : 25;
  }
  if (type === 'volcano') {
    return 50;
  }
  return 20; // Default radius in km
};

/**
 * Normalizer: GDACS RSS Feed Item -> Standard Disaster Format
 */
const normalizeGdacsItem = (item) => {
  const rawType = item['gdacs:eventtype'] || '';
  const type = mapGdacsType(rawType);
  const severity = mapGdacsSeverity(item['gdacs:alertlevel']);

  // Extract coordinates
  let lat = null;
  let lng = null;
  if (item['geo:Point']) {
    lat = parseFloat(item['geo:Point']['geo:lat']);
    lng = parseFloat(item['geo:Point']['geo:long']);
  } else if (item['georss:point']) {
    const parts = String(item['georss:point']).split(/\s+/);
    lat = parseFloat(parts[0]);
    lng = parseFloat(parts[1]);
  }

  // Extract magnitude
  let magnitude = null;
  if (item['gdacs:severity']) {
    if (typeof item['gdacs:severity'] === 'object' && item['gdacs:severity']['@_value']) {
      magnitude = parseFloat(item['gdacs:severity']['@_value']);
    } else if (typeof item['gdacs:severity'] === 'number') {
      magnitude = item['gdacs:severity'];
    }
  }

  const id = item.guid?.['#text'] || item.guid || `GDACS_${item['gdacs:eventid'] || Date.now()}`;
  const radius = calculateRadius(type, severity, magnitude);

  return {
    id: `GDACS_${id}`,
    title: item.title || `${severity.toUpperCase()} Alert: ${type}`,
    type,
    description: item.description || '',
    severity,
    magnitude: isNaN(magnitude) ? null : magnitude,
    depth: null,
    latitude: lat,
    longitude: lng,
    affectedRadius: radius,
    country: item['gdacs:country'] || '',
    location: item['gdacs:country'] || 'Global',
    timestamp: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
    source: 'GDACS',
    status: item['gdacs:iscurrent'] === false ? 'resolved' : 'active',
    link: item.link || '',
  };
};

/**
 * Normalizer: USGS GeoJSON Feature -> Standard Disaster Format
 */
const normalizeUsgsFeature = (feature) => {
  const props = feature.properties || {};
  const geom = feature.geometry || {};
  const coords = geom.coordinates || [0, 0, 0];

  const mag = props.mag !== null && props.mag !== undefined ? parseFloat(props.mag) : null;
  let severity = 'low';
  if (mag !== null) {
    if (mag >= 7.0) severity = 'critical';
    else if (mag >= 5.5) severity = 'high';
    else if (mag >= 4.0) severity = 'medium';
    else severity = 'low';
  }

  const radius = calculateRadius('earthquake', severity, mag);

  return {
    id: `USGS_${feature.id}`,
    title: props.title || `M ${mag || '?'} Earthquake`,
    type: 'earthquake',
    description: `Earthquake at ${props.place || 'Unknown Location'} with magnitude ${mag || 'N/A'}.`,
    severity,
    magnitude: mag,
    depth: coords[2] !== undefined ? parseFloat(coords[2]) : null, // Depth in km
    latitude: parseFloat(coords[1]),
    longitude: parseFloat(coords[0]),
    affectedRadius: radius,
    country: props.place?.split(',')?.pop()?.trim() || '',
    location: props.place || 'Unknown',
    timestamp: props.time ? new Date(props.time).toISOString() : new Date().toISOString(),
    source: 'USGS',
    status: 'active',
    link: props.url || '',
  };
};

/**
 * Normalizer: NASA EONET Event -> Standard Disaster Format
 */
const normalizeNasaEvent = (event) => {
  const categoryId = event.categories?.[0]?.id || '';
  let type = 'other';
  if (categoryId === 'wildfires') type = 'wildfire';
  else if (categoryId === 'severeStorms') type = 'storm';
  else if (categoryId === 'volcanoes') type = 'volcano';
  else if (categoryId === 'floods') type = 'flood';
  else if (categoryId === 'earthquakes') type = 'earthquake';
  else if (categoryId === 'drought') type = 'drought';
  else if (categoryId === 'landslides') type = 'landslide';

  // Get most recent geometry coordinates [lng, lat]
  const latestGeom = event.geometry?.[event.geometry.length - 1] || {};
  const coords = latestGeom.coordinates || [0, 0];
  const [lng, lat] = coords;

  const severity = 'medium';
  const radius = calculateRadius(type, severity, null);

  return {
    id: `NASA_${event.id}`,
    title: event.title || `Natural Event: ${type}`,
    type,
    description: event.description || `NASA EONET reported ${type} event.`,
    severity,
    magnitude: latestGeom.magnitudeValue || null,
    depth: null,
    latitude: parseFloat(lat),
    longitude: parseFloat(lng),
    affectedRadius: radius,
    country: '',
    location: event.title || 'Global',
    timestamp: latestGeom.date ? new Date(latestGeom.date).toISOString() : new Date().toISOString(),
    source: 'NASA_EONET',
    status: event.closed ? 'resolved' : 'active',
    link: event.link || event.sources?.[0]?.url || '',
  };
};

// ==========================================
// CONTROLLER HANDLERS
// ==========================================

/**
 * @desc    Fetch and normalize live general disaster data from GDACS
 * @route   GET /api/disasters/live
 * @access  Public
 */
export const getLiveDisasters = async (req, res, next) => {
  try {
    const { limit = 50, type } = req.query;

    const response = await fetch('https://www.gdacs.org/xml/rss.xml', {
      headers: { 'User-Agent': 'DisasterManagementApp/1.0' },
    });

    if (!response.ok) {
      throw new Error(`GDACS feed responded with status ${response.status}`);
    }

    const xml = await response.text();
    const parsed = xmlParser.parse(xml);
    const rawItems = parsed?.rss?.channel?.item || [];
    const itemsArray = Array.isArray(rawItems) ? rawItems : [rawItems];

    let normalized = itemsArray
      .map(normalizeGdacsItem)
      .filter((item) => item.latitude !== null && item.longitude !== null && !isNaN(item.latitude) && !isNaN(item.longitude));

    if (type) {
      normalized = normalized.filter((item) => item.type.toLowerCase() === type.toLowerCase());
    }

    const result = normalized.slice(0, parseInt(limit, 10));

    res.status(200).json({
      success: true,
      count: result.length,
      source: 'GDACS',
      data: result,
    });
  } catch (error) {
    console.error('GDACS Fetch Error:', error.message);
    res.status(502).json({
      success: false,
      message: 'Failed to fetch live data from GDACS',
      error: error.message,
    });
  }
};

/**
 * @desc    Fetch and normalize live earthquake data from USGS GeoJSON API
 * @route   GET /api/disasters/earthquakes
 * @access  Public
 */
export const getEarthquakes = async (req, res, next) => {
  try {
    const { minMag, limit = 100, feed = 'all_day' } = req.query;

    // Supported USGS summary feeds: all_day, all_week, 2.5_day, 4.5_day, significant_month
    const feedUrl = `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${feed}.geojson`;

    const response = await fetch(feedUrl, {
      headers: { 'User-Agent': 'DisasterManagementApp/1.0' },
    });

    if (!response.ok) {
      throw new Error(`USGS feed responded with status ${response.status}`);
    }

    const json = await response.json();
    const features = json.features || [];

    let normalized = features
      .map(normalizeUsgsFeature)
      .filter((item) => item.latitude !== null && item.longitude !== null && !isNaN(item.latitude) && !isNaN(item.longitude));

    if (minMag) {
      const min = parseFloat(minMag);
      normalized = normalized.filter((item) => item.magnitude !== null && item.magnitude >= min);
    }

    const result = normalized.slice(0, parseInt(limit, 10));

    res.status(200).json({
      success: true,
      count: result.length,
      source: 'USGS',
      data: result,
    });
  } catch (error) {
    console.error('USGS Fetch Error:', error.message);
    res.status(502).json({
      success: false,
      message: 'Failed to fetch earthquake data from USGS',
      error: error.message,
    });
  }
};

/**
 * @desc    Fetch and normalize natural events from NASA EONET
 * @route   GET /api/disasters/nasa
 * @access  Public
 */
export const getNasaEvents = async (req, res, next) => {
  try {
    const { limit = 50, category, status = 'open' } = req.query;

    let url = `https://eonet.gsfc.nasa.gov/api/v3/events?status=${status}&limit=${limit}`;
    if (category) {
      url += `&category=${category}`;
    }

    const response = await fetch(url, {
      headers: { 'User-Agent': 'DisasterManagementApp/1.0' },
    });

    if (!response.ok) {
      throw new Error(`NASA EONET responded with status ${response.status}`);
    }

    const json = await response.json();
    const events = json.events || [];

    const normalized = events
      .map(normalizeNasaEvent)
      .filter((item) => item.latitude !== null && item.longitude !== null && !isNaN(item.latitude) && !isNaN(item.longitude));

    res.status(200).json({
      success: true,
      count: normalized.length,
      source: 'NASA_EONET',
      data: normalized,
    });
  } catch (error) {
    console.error('NASA EONET Fetch Error:', error.message);
    res.status(502).json({
      success: false,
      message: 'Failed to fetch natural events from NASA EONET',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all combined disasters (GDACS + USGS + NASA + Database)
 * @route   GET /api/disasters
 * @access  Public
 */
export const getAllDisasters = async (req, res, next) => {
  try {
    const { type, severity, limit = 100 } = req.query;

    // 1. Fetch saved disasters from MongoDB if connected
    let dbDisasters = [];
    if (mongoose.connection.readyState === 1) {
      try {
        dbDisasters = await Disaster.find().sort({ createdAt: -1 }).limit(50);
      } catch (dbErr) {
        console.warn('MongoDB disaster query warning:', dbErr.message);
      }
    }

    // 2. Fetch live data in parallel
    const [gdacsRes, usgsRes, nasaRes] = await Promise.allSettled([
      fetch('https://www.gdacs.org/xml/rss.xml').then((r) => r.text()),
      fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson').then((r) => r.json()),
      fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=30').then((r) => r.json()),
    ]);

    let combined = [];

    // Add GDACS
    if (gdacsRes.status === 'fulfilled') {
      try {
        const parsed = xmlParser.parse(gdacsRes.value);
        const rawItems = parsed?.rss?.channel?.item || [];
        const items = Array.isArray(rawItems) ? rawItems : [rawItems];
        combined.push(...items.map(normalizeGdacsItem));
      } catch (e) {
        console.warn('GDACS parse error in aggregate:', e.message);
      }
    }

    // Add USGS
    if (usgsRes.status === 'fulfilled' && usgsRes.value?.features) {
      combined.push(...usgsRes.value.features.map(normalizeUsgsFeature));
    }

    // Add NASA EONET
    if (nasaRes.status === 'fulfilled' && nasaRes.value?.events) {
      combined.push(...nasaRes.value.events.map(normalizeNasaEvent));
    }

    // Add DB records normalized
    if (dbDisasters.length > 0) {
      const normalizedDb = dbDisasters.map((d) => ({
        id: `DB_${d._id}`,
        title: d.title,
        type: d.type,
        description: d.description,
        severity: d.severity,
        magnitude: d.magnitude || null,
        depth: d.depth || null,
        latitude: d.latitude,
        longitude: d.longitude,
        affectedRadius: d.affectedRadius || 10,
        country: d.country || '',
        location: d.location || '',
        timestamp: d.timestamp ? new Date(d.timestamp).toISOString() : new Date(d.createdAt).toISOString(),
        source: d.source || 'MANUAL',
        status: d.status || 'active',
        link: d.link || '',
      }));
      combined.push(...normalizedDb);
    }

    // Filter valid coordinates
    combined = combined.filter(
      (item) => item.latitude !== null && item.longitude !== null && !isNaN(item.latitude) && !isNaN(item.longitude)
    );

    // Apply query filters
    if (type) {
      combined = combined.filter((item) => item.type.toLowerCase() === type.toLowerCase());
    }
    if (severity) {
      combined = combined.filter((item) => item.severity.toLowerCase() === severity.toLowerCase());
    }

    // Sort newest first
    combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const result = combined.slice(0, parseInt(limit, 10));

    res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single disaster by ID (from MongoDB or external lookup)
 * @route   GET /api/disasters/:id
 * @access  Public
 */
export const getDisasterById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id.startsWith('DB_') || id.match(/^[0-9a-fA-F]{24}$/)) {
      const cleanId = id.replace('DB_', '');
      const disaster = await Disaster.findById(cleanId);
      if (!disaster) {
        return res.status(404).json({ success: false, message: 'Disaster not found' });
      }
      return res.status(200).json({ success: true, data: disaster });
    }

    res.status(200).json({
      success: true,
      message: 'External disaster ID query. Use /api/disasters to retrieve normalized event payload.',
      id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a custom disaster record in MongoDB
 * @route   POST /api/disasters
 * @access  Public / Admin
 */
export const createDisaster = async (req, res, next) => {
  try {
    const disaster = await Disaster.create(req.body);
    res.status(201).json({
      success: true,
      data: disaster,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a disaster record in MongoDB
 * @route   PUT /api/disasters/:id
 * @access  Public / Admin
 */
export const updateDisaster = async (req, res, next) => {
  try {
    const disaster = await Disaster.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!disaster) {
      return res.status(404).json({ success: false, message: 'Disaster not found' });
    }

    res.status(200).json({
      success: true,
      data: disaster,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a disaster record in MongoDB
 * @route   DELETE /api/disasters/:id
 * @access  Public / Admin
 */
export const deleteDisaster = async (req, res, next) => {
  try {
    const disaster = await Disaster.findByIdAndDelete(req.params.id);

    if (!disaster) {
      return res.status(404).json({ success: false, message: 'Disaster not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Disaster removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
