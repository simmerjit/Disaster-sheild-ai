import React, { useState, useEffect } from 'react';
import {
  CloudRain,
  Wind,
  Droplets,
  Thermometer,
  Compass,
  AlertTriangle,
  RefreshCw,
  X,
  MapPin,
  ShieldAlert,
} from 'lucide-react';
import { fetchLiveCoordinatesWeather } from '../services/weatherApi';

export const WeatherWidget = ({
  targetLocation, // { latitude, longitude, name, type }
  onClose,
}) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadWeather = async () => {
    if (!targetLocation || targetLocation.latitude === null || targetLocation.longitude === null) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLiveCoordinatesWeather(
        targetLocation.latitude,
        targetLocation.longitude
      );
      setWeather(data);
    } catch (err) {
      console.error('Weather widget fetch error:', err);
      setError('Unable to fetch live weather for this location.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather();
  }, [targetLocation?.latitude, targetLocation?.longitude]);

  if (!targetLocation) return null;

  return (
    <div className="weather-hud-widget">
      {/* Header */}
      <div className="weather-hud-header">
        <div className="weather-hud-location">
          <MapPin size={14} className="hud-pin-icon" />
          <div className="location-texts">
            <span className="location-name">
              {targetLocation.name || 'Target Location'}
            </span>
            <span className="location-coords">
              {Number(targetLocation.latitude).toFixed(3)}°, {Number(targetLocation.longitude).toFixed(3)}°
            </span>
          </div>
        </div>

        <div className="weather-hud-actions">
          <button
            onClick={loadWeather}
            disabled={loading}
            className="hud-action-btn"
            title="Refresh weather data"
          >
            <RefreshCw size={13} className={loading ? 'spin-icon' : ''} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="hud-action-btn hud-close-btn"
              title="Close weather widget"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && !weather && (
        <div className="weather-hud-loading">
          <RefreshCw size={18} className="spin-icon" />
          <span>Fetching live meteorological data...</span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="weather-hud-error">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Weather Content */}
      {weather && (
        <div className="weather-hud-body">
          {/* Severe Weather Warning Alert */}
          {weather.alert && (
            <div className={`weather-alert-banner alert-${weather.alert.level}`}>
              <ShieldAlert size={14} className="alert-icon" />
              <div className="alert-text">
                <strong>{weather.alert.title}</strong>
                <p>{weather.alert.message}</p>
              </div>
            </div>
          )}

          {/* Primary Metric Row */}
          <div className="weather-main-row">
            <div className="weather-temp-block">
              <span className="weather-condition-icon">{weather.weatherIcon}</span>
              <div>
                <div className="temp-value">
                  {Math.round(weather.temperature)}°C
                </div>
                <div className="temp-feels-like">
                  Feels like {Math.round(weather.feelsLike)}°C
                </div>
              </div>
            </div>

            <div className="weather-condition-badge">
              <span>{weather.weatherLabel}</span>
            </div>
          </div>

          {/* Detailed Meteorological Metrics Grid */}
          <div className="weather-metrics-grid">
            {/* Wind */}
            <div className="hud-metric-item">
              <Wind size={14} className="metric-icon" />
              <div className="metric-info">
                <span className="metric-title">Wind</span>
                <span className="metric-val">{weather.windSpeed} km/h</span>
              </div>
            </div>

            {/* Precipitation / Rain */}
            <div className="hud-metric-item">
              <CloudRain size={14} className="metric-icon" />
              <div className="metric-info">
                <span className="metric-title">Precipitation</span>
                <span className="metric-val">{weather.precipitation || weather.rain || 0} mm</span>
              </div>
            </div>

            {/* Humidity */}
            <div className="hud-metric-item">
              <Droplets size={14} className="metric-icon" />
              <div className="metric-info">
                <span className="metric-title">Humidity</span>
                <span className="metric-val">{weather.humidity}%</span>
              </div>
            </div>

            {/* Pressure */}
            <div className="hud-metric-item">
              <Thermometer size={14} className="metric-icon" />
              <div className="metric-info">
                <span className="metric-title">Pressure</span>
                <span className="metric-val">{Math.round(weather.pressure || 1013)} hPa</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="weather-hud-footer">
            <span>Live WMO / IMD Synoptic Feed</span>
            <small>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;
