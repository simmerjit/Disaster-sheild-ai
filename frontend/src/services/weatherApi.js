import axios from 'axios';

// Backend API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Fetch MOSDAC weather backend status
 */
export const fetchMosdacStatus = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/weather/mosdac/status`, { timeout: 8000 });
    return response.data;
  } catch (error) {
    console.warn('MOSDAC status check fallback:', error.message);
    return { success: false, configured: false };
  }
};

/**
 * Weather condition code mapper (WMO standard)
 */
export const mapWeatherCode = (code) => {
  if (code === 0) return { label: 'Clear Sky', icon: '☀️', condition: 'clear', risk: 'low' };
  if (code === 1 || code === 2) return { label: 'Partly Cloudy', icon: '🌤️', condition: 'partly_cloudy', risk: 'low' };
  if (code === 3) return { label: 'Overcast', icon: '☁️', condition: 'cloudy', risk: 'low' };
  if (code === 45 || code === 48) return { label: 'Fog / Mist', icon: '🌫️', condition: 'fog', risk: 'medium' };
  if (code >= 51 && code <= 55) return { label: 'Light Drizzle', icon: '🌦️', condition: 'drizzle', risk: 'low' };
  if (code >= 61 && code <= 65) return { label: 'Rain', icon: '🌧️', condition: 'rain', risk: 'medium' };
  if (code >= 66 && code <= 67) return { label: 'Freezing Rain', icon: '🌨️', condition: 'freezing_rain', risk: 'high' };
  if (code >= 71 && code <= 77) return { label: 'Snow Fall', icon: '❄️', condition: 'snow', risk: 'medium' };
  if (code >= 80 && code <= 82) return { label: 'Heavy Rain Showers', icon: '🌧️', condition: 'heavy_rain', risk: 'high' };
  if (code >= 85 && code <= 86) return { label: 'Snow Showers', icon: '🌨️', condition: 'heavy_snow', risk: 'high' };
  if (code === 95) return { label: 'Thunderstorm', icon: '⛈️', condition: 'thunderstorm', risk: 'critical' };
  if (code >= 96 && code <= 99) return { label: 'Severe Thunderstorm & Hail', icon: '⛈️', condition: 'severe_thunderstorm', risk: 'critical' };
  return { label: 'Variable Weather', icon: '⛅', condition: 'variable', risk: 'low' };
};

/**
 * Fetch real-time live meteorological weather data for any coordinate
 * Powered by Open-Meteo Global / IMD high-resolution forecast models (free, open, no-key required)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 */
export const fetchLiveCoordinatesWeather = async (lat, lng) => {
  if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
    throw new Error('Invalid coordinates for weather query');
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,precipitation_probability,rain&timezone=auto`;

  const response = await axios.get(url, { timeout: 10000 });
  const current = response.data.current || {};
  const weatherInfo = mapWeatherCode(current.weather_code || 0);

  // Compute severe weather assessment
  let weatherAlert = null;
  const wind = Number(current.wind_speed_10m || 0);
  const rain = Number(current.precipitation || current.rain || 0);
  const temp = Number(current.temperature_2m || 0);

  if (current.weather_code >= 95 || wind > 75 || rain > 30) {
    weatherAlert = {
      level: 'critical',
      title: 'Severe Storm / Torrential Weather Alert',
      message: `Extreme conditions detected: Wind ${wind} km/h, Rain ${rain} mm/h. High danger of flooding/wind damage.`,
    };
  } else if (wind > 45 || rain > 10 || temp > 42) {
    weatherAlert = {
      level: 'high',
      title: 'Hazardous Weather Advisory',
      message: `Caution: High winds (${wind} km/h) or heavy rainfall (${rain} mm) in this area.`,
    };
  } else if (rain > 2 || temp > 38 || temp < 0) {
    weatherAlert = {
      level: 'medium',
      title: 'Moderate Weather Caution',
      message: `Rain (${rain} mm) or temperature extremes (${temp}°C) observed.`,
    };
  }

  return {
    latitude: lat,
    longitude: lng,
    timezone: response.data.timezone,
    elevation: response.data.elevation,
    temperature: current.temperature_2m,
    feelsLike: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    isDay: current.is_day === 1,
    precipitation: current.precipitation,
    rain: current.rain,
    windSpeed: current.wind_speed_10m,
    windDirection: current.wind_direction_10m,
    windGusts: current.wind_gusts_10m,
    pressure: current.surface_pressure,
    weatherCode: current.weather_code,
    weatherLabel: weatherInfo.label,
    weatherIcon: weatherInfo.icon,
    weatherRisk: weatherInfo.risk,
    alert: weatherAlert,
    timestamp: current.time,
  };
};

export default {
  fetchLiveCoordinatesWeather,
  fetchMosdacStatus,
  mapWeatherCode,
};
