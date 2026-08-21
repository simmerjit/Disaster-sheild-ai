import React from 'react';
import {
  ExternalLink,
  MapPin,
  Activity,
  Calendar,
  Layers,
  AlertTriangle,
  CloudSun,
  Navigation,
  GraduationCap,
} from 'lucide-react';
import { getGoogleMapsDirectionsUrl } from '../utils/geoUtils';

const typeEmojis = {
  earthquake: '🔴',
  cyclone: '🟠',
  flood: '🔵',
  wildfire: '🔥',
  volcano: '🟣',
  drought: '🌾',
  tsunami: '🌊',
  storm: '⛈️',
  landslide: '⛰️',
  other: '⚠️',
};

const severityColors = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

export const DisasterPopup = ({
  disaster,
  userCoords,
  onOpenWeather,
  onOpenNavigation,
  onOpenFacilities,
  onOpenDetails,
  onOpenSurvivalAcademy,
}) => {
  if (!disaster) return null;

  const {
    title,
    type = 'other',
    severity = 'medium',
    location,
    country,
    magnitude,
    depth,
    affectedRadius,
    timestamp,
    source,
    status,
    description,
    link,
    latitude,
    longitude,
    instruction,
    effective,
    expires,
    sender,
  } = disaster;

  const isSachet = (source || '').toUpperCase() === 'SACHET';
  const emoji = typeEmojis[type.toLowerCase()] || '⚠️';
  const sevColor = severityColors[severity.toLowerCase()] || '#eab308';
  const formattedDate = timestamp ? new Date(timestamp).toLocaleString() : 'N/A';
  const radiusKm = Number(affectedRadius || 15);
  const radiusMeters = radiusKm * 1000;

  const userLat = userCoords ? Number(userCoords.latitude) : null;
  const userLng = userCoords ? Number(userCoords.longitude) : null;
  const directionsUrl = getGoogleMapsDirectionsUrl(
    userLat,
    userLng,
    Number(latitude),
    Number(longitude)
  );

  return (
    <div className="disaster-popup-content">
      {/* Header */}
      <div className="popup-header">
        <div className="popup-type-badge">
          <span className="popup-emoji">{emoji}</span>
          <span className="popup-type-text">{type.toUpperCase()}</span>
        </div>
        <div className="popup-header-right">
          {isSachet && (
            <span className="sachet-badge">
              ✓ SACHET / NDMA
            </span>
          )}
          <span
            className="popup-severity-badge"
            style={{ backgroundColor: `${sevColor}20`, color: sevColor, borderColor: sevColor }}
          >
            {severity.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Main Title & Description */}
      <h3 className="popup-title">{title}</h3>
      {description && <p className="popup-description">{description}</p>}

      {/* SACHET Actionable Emergency Advisory Callout */}
      {isSachet && instruction && (
        <div className="sachet-instruction-box">
          <span className="instruction-icon">⚠️</span>
          <p className="instruction-text">
            <strong>Advisory:</strong> {instruction}
          </p>
        </div>
      )}

      {/* Telemetry Metrics Grid */}
      <div className="popup-metrics-grid">
        <div className="metric-cell">
          <MapPin size={13} className="metric-icon" />
          <span className="metric-val">{location || country || 'Global Coordinates'}</span>
        </div>
        <div className="metric-cell">
          <Activity size={13} className="metric-icon" />
          <span className="metric-val">
            {Number(latitude).toFixed(3)}°, {Number(longitude).toFixed(3)}°
          </span>
        </div>
        <div className="metric-cell">
          <Calendar size={13} className="metric-icon" />
          <span className="metric-val">{formattedDate}</span>
        </div>
        <div className="metric-cell">
          <Layers size={13} className="metric-icon" />
          <span className="metric-val">Radius: ~{radiusKm} km</span>
        </div>
        {magnitude != null && (
          <div className="metric-cell highlight">
            <span className="metric-label">Magnitude:</span>
            <span className="metric-val font-bold">M {magnitude}</span>
          </div>
        )}
        {depth != null && (
          <div className="metric-cell">
            <span className="metric-label">Depth:</span>
            <span className="metric-val">{depth} km</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="popup-actions-row">
        {onOpenDetails && (
          <button
            onClick={() => onOpenDetails(disaster)}
            className="popup-action-btn primary-action"
            title="Open comprehensive verified incident details modal"
          >
            <span>Full Intel</span>
          </button>
        )}

        {onOpenSurvivalAcademy && (
          <button
            onClick={() => onOpenSurvivalAcademy(type)}
            className="popup-action-btn survival-action"
            title="Learn how to survive this disaster"
          >
            <GraduationCap size={13} />
            <span>Survive</span>
          </button>
        )}

        <button
          onClick={() => {
            if (onOpenWeather) {
              onOpenWeather({
                latitude: Number(latitude),
                longitude: Number(longitude),
                name: location || title,
                type,
              });
            }
          }}
          className="popup-action-btn weather-action"
          title="Check real-time meteorological weather at this location"
        >
          <CloudSun size={13} />
          <span>Live Weather</span>
        </button>

        {onOpenFacilities && (
          <button
            onClick={() => {
              onOpenFacilities({
                latitude: Number(latitude),
                longitude: Number(longitude),
                name: title || `${type} Event`,
                type: 'disaster',
              });
            }}
            className="popup-action-btn facilities-action"
            title="Discover nearby emergency facilities via Google Places"
          >
            <span>🏥 Facilities</span>
          </button>
        )}

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="popup-action-btn nav-action"
          title="Open directions in Google Maps"
        >
          <Navigation size={13} />
          <span>Navigate</span>
        </a>
      </div>

      {/* Footer Info */}
      <div className="popup-footer">
        <div className="popup-source-tag">
          Source: <strong>{isSachet ? 'NDMA SACHET' : source || 'Backend API'}</strong>
          {status && <span className={`status-pill status-${status}`}>{status}</span>}
        </div>

        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="popup-link-btn"
            title="View official alert / CAP XML"
          >
            <span>{isSachet ? 'Official CAP XML' : 'Official Report'}</span>
            <ExternalLink size={13} />
          </a>
        )}
      </div>
    </div>
  );
};

export default DisasterPopup;
