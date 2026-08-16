/**
 * @module controllers/places.controller
 * @desc Google Places API (New) Nearby Search Integration
 *
 * Provides secondary discovery layer for nearby emergency facilities:
 * - hospitals, medical centers, pharmacies, police stations, fire stations, clinics.
 *
 * NOTE: Google Places results are UNVERIFIED external facilities.
 * Officially verified emergency shelters come from the MongoDB Shelter collection.
 *
 * Official Google Places API (New) endpoint:
 * POST https://places.googleapis.com/v1/places:searchNearby
 */

// Supported application facility types mapped to Google Places API (New) Table A types
const TYPE_MAPPING = {
  hospital: ['hospital'],
  medical_center: ['hospital', 'doctor', 'medical_lab'],
  pharmacy: ['pharmacy', 'drugstore'],
  police: ['police'],
  fire_station: ['fire_station'],
  clinic: ['doctor', 'dental_clinic', 'medical_lab'],
};

// Maximum safe radius allowed for a nearby search (50 km in meters)
const MAX_RADIUS_METERS = 50000;
const DEFAULT_RADIUS_METERS = 5000;

/**
 * @desc    Get nearby emergency facilities via Google Places (New) API
 * @route   GET /api/places/nearby
 * @access  Public
 *
 * Query params:
 *   latitude  (number, required) - Latitude of the search center
 *   longitude (number, required) - Longitude of the search center
 *   radius    (number, optional) - Radius in meters (default: 5000, max: 50000)
 *   type      (string, optional) - Facility type (hospital, medical_center, pharmacy, police, fire_station, clinic)
 */
export const getNearbyPlaces = async (req, res) => {
  try {
    const { latitude, longitude, radius, type } = req.query;

    // ── 1. Coordinate Validation ─────────────────────────────────────────────
    if (latitude === undefined || longitude === undefined || latitude === '' || longitude === '') {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude query parameters are required.',
        example: '/api/places/nearby?latitude=22.5726&longitude=88.3639&radius=5000&type=hospital',
      });
    }

    const latNum = Number(latitude);
    const lngNum = Number(longitude);

    if (isNaN(latNum) || isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.',
      });
    }

    // ── 2. Radius Validation ─────────────────────────────────────────────────
    let radiusNum = DEFAULT_RADIUS_METERS;
    if (radius !== undefined && radius !== '') {
      radiusNum = Number(radius);
      if (isNaN(radiusNum) || radiusNum <= 0 || radiusNum > MAX_RADIUS_METERS) {
        return res.status(400).json({
          success: false,
          error: `Invalid radius. Radius must be a positive number between 1 and ${MAX_RADIUS_METERS} meters (50 km).`,
        });
      }
    }

    // ── 3. Type Validation ───────────────────────────────────────────────────
    const requestedType = (type || 'hospital').toLowerCase().trim();
    const includedTypes = TYPE_MAPPING[requestedType];

    if (!includedTypes) {
      return res.status(400).json({
        success: false,
        error: `Unsupported place type '${requestedType}'.`,
        supportedTypes: Object.keys(TYPE_MAPPING),
      });
    }

    // ── 4. API Key Check ─────────────────────────────────────────────────────
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey || apiKey.startsWith('your_')) {
      return res.status(503).json({
        success: false,
        source: 'GOOGLE_PLACES',
        message: 'Google Places API key is not configured on the backend server.',
        setup: {
          instructions: 'Add GOOGLE_PLACES_API_KEY to your backend .env file',
          requiredEnvVar: 'GOOGLE_PLACES_API_KEY',
          requiredApi: 'Places API (New) enabled in Google Cloud Console',
        },
      });
    }

    // ── 5. Call Google Places (New) Nearby Search Endpoint ───────────────────
    const googleApiUrl = 'https://places.googleapis.com/v1/places:searchNearby';

    const requestPayload = {
      includedTypes,
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: {
            latitude: latNum,
            longitude: lngNum,
          },
          radius: radiusNum,
        },
      },
    };

    // Minimal FieldMask: only request the exact fields we need
    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.formattedAddress',
      'places.location',
      'places.rating',
      'places.googleMapsUri',
      'places.types',
    ].join(',');

    const googleResponse = await fetch(googleApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify(requestPayload),
      signal: AbortSignal.timeout(12000), // 12 second timeout
    });

    if (!googleResponse.ok) {
      const errorData = await googleResponse.json().catch(() => ({}));
      console.error('Google Places API Error HTTP', googleResponse.status, errorData.error?.message || '');
      return res.status(502).json({
        success: false,
        source: 'GOOGLE_PLACES',
        message: 'Failed to fetch emergency facilities from Google Places API.',
        error: errorData.error?.message || `Google Places API returned HTTP ${googleResponse.status}`,
      });
    }

    const responseJson = await googleResponse.json();
    const rawPlaces = responseJson.places || [];

    // ── 6. Normalize Google Places Response ──────────────────────────────────
    const normalizedPlaces = rawPlaces.map((place, index) => {
      const placeLat = place.location?.latitude ?? null;
      const placeLng = place.location?.longitude ?? null;

      return {
        id: place.id || `google_place_${index}`,
        name: place.displayName?.text || 'Emergency Facility',
        type: requestedType,
        address: place.formattedAddress || 'Address not available',
        latitude: placeLat,
        longitude: placeLng,
        rating: typeof place.rating === 'number' ? place.rating : null,
        googleMapsUri:
          place.googleMapsUri ||
          (placeLat !== null && placeLng !== null
            ? `https://www.google.com/maps/search/?api=1&query=${placeLat},${placeLng}`
            : null),
        source: 'GOOGLE_PLACES',
      };
    });

    // ── 7. Return Normalized Response ───────────────────────────────────────
    res.status(200).json({
      success: true,
      source: 'GOOGLE_PLACES',
      query: {
        center: { latitude: latNum, longitude: lngNum },
        radiusMeters: radiusNum,
        type: requestedType,
      },
      count: normalizedPlaces.length,
      data: normalizedPlaces,
      disclaimer:
        'Nearby facilities are discovered via Google Places API and are NOT verified emergency shelters. Verified emergency shelters are provided by the official emergency management database.',
    });
  } catch (error) {
    console.error('getNearbyPlaces Exception:', error.message);

    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return res.status(502).json({
        success: false,
        source: 'GOOGLE_PLACES',
        message: 'Google Places API request timed out.',
      });
    }

    res.status(500).json({
      success: false,
      source: 'GOOGLE_PLACES',
      message: 'An internal server error occurred while searching nearby emergency facilities.',
      error: error.message,
    });
  }
};
