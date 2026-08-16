/**
 * @module  controllers/weather.controller
 * @desc    MOSDAC (ISRO) Weather Data Integration
 *
 * MOSDAC does NOT provide a public REST/JSON API.
 * Their official "Data Download API" requires:
 *   - A registered MOSDAC account (https://mosdac.gov.in/internal/registration)
 *   - Username + Password credentials
 *   - A specific datasetId for the desired product
 *   - Calls to their internal download endpoint
 *
 * This controller implements:
 *   1. Credential check — returns clear setup instructions if not configured
 *   2. Authenticated data fetch — when credentials are present, calls MOSDAC's
 *      data listing endpoint to retrieve available weather/forecast products
 *   3. Proper error handling — 502 for MOSDAC unavailable, 503 for not configured
 *
 * Environment variables required (add to .env):
 *   MOSDAC_USERNAME    — Your registered MOSDAC username
 *   MOSDAC_PASSWORD    — Your registered MOSDAC password
 *   MOSDAC_DATASET_ID  — The dataset ID for the weather product you want
 *
 * Official documentation:
 *   https://mosdac.gov.in/downloadapi-manual
 */

// ── MOSDAC Data Download API base URL ────────────────────────────────────────
// This is the official authenticated endpoint documented in the MOSDAC
// "User Manual for MOSDAC Data Download API" page.
const MOSDAC_API_BASE = 'https://mosdac.gov.in';

/**
 * Check whether MOSDAC credentials are configured in environment variables.
 * Returns an object with { configured: boolean, missing: string[] }
 */
const checkMosdacCredentials = () => {
  const required = ['MOSDAC_USERNAME', 'MOSDAC_PASSWORD', 'MOSDAC_DATASET_ID'];
  const missing = required.filter((key) => !process.env[key] || process.env[key].startsWith('your_'));
  return {
    configured: missing.length === 0,
    missing,
  };
};

/**
 * Build the MOSDAC authentication token using the documented API flow.
 * The MOSDAC download API uses HTTP basic-style auth or session-based login.
 * This returns base64-encoded credentials for the Authorization header.
 */
const buildMosdacAuthHeader = () => {
  const username = process.env.MOSDAC_USERNAME;
  const password = process.env.MOSDAC_PASSWORD;
  return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
};

/**
 * @desc    Get MOSDAC weather data status and available products
 * @route   GET /api/weather/mosdac
 * @access  Public
 *
 * Query params:
 *   ?product=city-weather|heavy-rain|lightning|heatwave|cyclone (optional filter)
 *
 * Response when credentials ARE configured:
 *   Attempts to query MOSDAC for available data and returns normalized results.
 *
 * Response when credentials are NOT configured:
 *   Returns 503 with clear instructions on what credentials are needed.
 */
export const getMosdacWeather = async (req, res) => {
  try {
    // ── Step 1: Check credentials ──────────────────────────────────────────
    const credentials = checkMosdacCredentials();

    if (!credentials.configured) {
      return res.status(503).json({
        success: false,
        source: 'MOSDAC',
        message: 'MOSDAC integration is not configured. Credentials are required.',
        setup: {
          instructions: [
            '1. Register for a MOSDAC account at https://mosdac.gov.in/internal/registration',
            '2. Wait for account approval via email from MOSDAC/SAC/ISRO',
            '3. Log in and navigate to Data Access → API based Access for documentation',
            '4. Identify the datasetId for the weather product you need',
            '5. Add the following to your backend .env file:',
          ],
          requiredEnvVars: {
            MOSDAC_USERNAME: 'Your registered MOSDAC username',
            MOSDAC_PASSWORD: 'Your registered MOSDAC password',
            MOSDAC_DATASET_ID: 'The dataset ID for the desired weather product',
          },
          missingVars: credentials.missing,
          documentationUrl: 'https://mosdac.gov.in/downloadapi-manual',
          registrationUrl: 'https://mosdac.gov.in/internal/registration',
          availableProducts: [
            'City Weather / 3-hourly forecast',
            'Heavy Rain Forecast (NWP models)',
            'Lightning Forecast',
            'Heat Wave Prediction (WRF model)',
            'Cyclone satellite observation / prediction',
            'Solar and Wind Forecast',
          ],
          note: 'MOSDAC does not provide a public REST API. All programmatic access requires registered credentials and a valid datasetId.',
        },
      });
    }

    // ── Step 2: Attempt authenticated MOSDAC data request ──────────────────
    const { product } = req.query;
    const datasetId = process.env.MOSDAC_DATASET_ID;

    // The MOSDAC data download API endpoint for listing available files
    // This follows the documented mdapi flow: authenticate → list → download
    const listUrl = `${MOSDAC_API_BASE}/catalog/search?datasetId=${encodeURIComponent(datasetId)}`;

    const response = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'DisasterShieldAI/1.0',
        'Authorization': buildMosdacAuthHeader(),
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    // ── Step 3: Handle MOSDAC response ─────────────────────────────────────
    if (response.status === 401 || response.status === 403) {
      return res.status(502).json({
        success: false,
        source: 'MOSDAC',
        message: 'MOSDAC authentication failed. Please verify your credentials.',
        details: {
          httpStatus: response.status,
          suggestion: 'Check MOSDAC_USERNAME and MOSDAC_PASSWORD in your .env file.',
          documentationUrl: 'https://mosdac.gov.in/downloadapi-manual',
        },
      });
    }

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        source: 'MOSDAC',
        message: `MOSDAC responded with HTTP ${response.status}`,
        details: {
          httpStatus: response.status,
          statusText: response.statusText,
          suggestion: 'The MOSDAC server may be temporarily unavailable. Try again later.',
        },
      });
    }

    // Try to parse as JSON; MOSDAC may return HTML or other formats
    const contentType = response.headers.get('content-type') || '';
    let data;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // MOSDAC might return HTML or XML depending on the endpoint
      const rawText = await response.text();
      data = {
        rawFormat: contentType,
        note: 'MOSDAC returned non-JSON data. The response may need to be parsed from XML/HTML/netCDF.',
        preview: rawText.substring(0, 500),
      };
    }

    // ── Step 4: Normalize and return ───────────────────────────────────────
    const normalizedResponse = {
      success: true,
      source: 'MOSDAC',
      datasetId,
      fetchedAt: new Date().toISOString(),
      data: {
        ...(product ? { requestedProduct: product } : {}),
        mosdac: data,
      },
    };

    res.status(200).json(normalizedResponse);
  } catch (error) {
    // Handle network errors, timeouts, etc.
    console.error('MOSDAC Fetch Error:', error.message);

    // Distinguish timeout from other errors
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return res.status(502).json({
        success: false,
        source: 'MOSDAC',
        message: 'MOSDAC request timed out. The server may be slow or unreachable.',
        error: error.message,
      });
    }

    res.status(502).json({
      success: false,
      source: 'MOSDAC',
      message: 'Failed to fetch weather data from MOSDAC',
      error: error.message,
    });
  }
};

/**
 * @desc    Get MOSDAC integration status and configuration info
 * @route   GET /api/weather/mosdac/status
 * @access  Public
 */
export const getMosdacStatus = async (req, res) => {
  const credentials = checkMosdacCredentials();

  res.status(200).json({
    success: true,
    source: 'MOSDAC',
    integration: {
      configured: credentials.configured,
      missingCredentials: credentials.missing,
      datasetId: credentials.configured ? process.env.MOSDAC_DATASET_ID : null,
      documentation: 'https://mosdac.gov.in/downloadapi-manual',
      registration: 'https://mosdac.gov.in/internal/registration',
    },
    availableProducts: [
      { id: 'city-weather', name: 'City Weather / 3-hourly Forecast', description: 'NWP model-based city-level weather forecast' },
      { id: 'heavy-rain', name: 'Heavy Rain Forecast', description: 'NWP model-based heavy rainfall prediction' },
      { id: 'lightning', name: 'Lightning Forecast', description: 'Lightning probability forecast' },
      { id: 'heatwave', name: 'Heat Wave Prediction', description: 'WRF model-based heatwave prediction over India' },
      { id: 'cyclone', name: 'Cyclone Observation & Prediction', description: 'Satellite-based cyclone tracking over Indian Ocean' },
      { id: 'solar-wind', name: 'Solar and Wind Forecast', description: 'Renewable energy weather forecast' },
    ],
    note: 'MOSDAC requires registered credentials for all programmatic data access. Products return data in scientific formats (HDF, netCDF, GeoTIFF).',
  });
};
