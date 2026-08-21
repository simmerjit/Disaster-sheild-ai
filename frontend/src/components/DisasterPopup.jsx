import React from 'react';
import {
  ExternalLink,
  MapPin,
  Activity,
  Clock,
  Layers,
  AlertTriangle,
  CloudSun,
  Navigation,
  GraduationCap,
  Building2,
  FileText,
  Radio,
  Sparkles,
} from 'lucide-react';
import { getGoogleMapsDirectionsUrl } from '../utils/geoUtils';

const typeEmojis = {
  earthquake: '🔴',
  cyclone: '🌀',
  flood: '🌊',
  wildfire: '🔥',
  volcano: '🌋',
  drought: '🌾',
  tsunami: '🌊',
  storm: '⛈️',
  landslide: '⛰️',
  other: '⚠️',
};

const severityConfig = {
  critical: { bg: 'rgba(239, 68, 68, 0.15)', text: '#fca5a5', border: 'rgba(239, 68, 68, 0.4)', dot: '#ef4444' },
  high: { bg: 'rgba(249, 115, 22, 0.15)', text: '#fdba74', border: 'rgba(249, 115, 22, 0.4)', dot: '#f97316' },
  medium: { bg: 'rgba(234, 179, 8, 0.15)', text: '#fde047', border: 'rgba(234, 179, 8, 0.4)', dot: '#eab308' },
  low: { bg: 'rgba(34, 197, 94, 0.15)', text: '#86efac', border: 'rgba(34, 197, 94, 0.4)', dot: '#22c55e' },
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
  } = disaster;

  const isSachet = (source || '').toUpperCase() === 'SACHET';
  const emoji = typeEmojis[type.toLowerCase()] || '⚠️';
  const sevKey = (severity || 'medium').toLowerCase();
  const sev = severityConfig[sevKey] || severityConfig.medium;

  const formattedDate = timestamp
    ? new Date(timestamp).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Live Signal';

  const radiusKm = Number(affectedRadius || 15);
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
      {/* 1. Header Badges */}
      <div className="popup-header">
        <div className="popup-type-badge">
          <span className="popup-emoji">{emoji}</span>
          <span className="popup-type-text">{type.toUpperCase()}</span>
        </div>

        <div className="popup-header-right">
          {isSachet && (
            <span className="sachet-badge">
              ✓ NDMA
            </span>
          )}
          <span
            className="popup-severity-badge"
            style={{
              backgroundColor: sev.bg,
              color: sev.text,
              borderColor: sev.border,
            }}
          >
            <span className="severity-pulse-dot" style={{ backgroundColor: sev.dot }} />
            {severity.toUpperCase()}
          </span>
        </div>
      </div>

      {/* 2. Main Title */}
      <h3 className="popup-title">{title}</h3>

      {/* 3. Description (if available) */}
      {description && (
        <p className="popup-description">
          {description}
        </p>
      )}

      {/* 4. Actionable Advisory Banner */}
      {instruction && (
        <div className="popup-instruction-banner">
          <AlertTriangle size={14} className="instruction-icon" />
          <div className="instruction-content">
            <span className="instruction-heading">Emergency Advisory</span>
            <p className="instruction-text">{instruction}</p>
          </div>
        </div>
      )}

      {/* 5. Clean Telemetry Metrics Grid */}
      <div className="popup-metrics-grid">
        <div className="metric-cell" title={location || country || 'Global Coordinates'}>
          <MapPin size={13} className="metric-icon" />
          <div className="metric-info">
            <span className="metric-label">Location</span>
            <span className="metric-val">{location || country || 'Global Area'}</span>
          </div>
        </div>

        <div className="metric-cell">
          <Activity size={13} className="metric-icon" />
          <div className="metric-info">
            <span className="metric-label">Coordinates</span>
            <span className="metric-val font-mono">
              {Number(latitude).toFixed(2)}°, {Number(longitude).toFixed(2)}°
            </span>
          </div>
        </div>

        <div className="metric-cell">
          <Clock size={13} className="metric-icon" />
          <div className="metric-info">
            <span className="metric-label">Reported</span>
            <span className="metric-val">{formattedDate}</span>
          </div>
        </div>

        <div className="metric-cell">
          <Layers size={13} className="metric-icon" />
          <div className="metric-info">
            <span className="metric-label">Impact Zone</span>
            <span className="metric-val">~{radiusKm} km radius</span>
          </div>
        </div>

        {magnitude != null && (
          <div className="metric-cell metric-cell-highlight">
            <Radio size={13} className="metric-icon highlight" />
            <div className="metric-info">
              <span className="metric-label">Magnitude</span>
              <span className="metric-val font-bold">M {magnitude}</span>
            </div>
          </div>
        )}

        {depth != null && (
          <div className="metric-cell">
            <span className="metric-icon text-muted">⬇</span>
            <div className="metric-info">
              <span className="metric-label">Depth</span>
              <span className="metric-val">{depth} km</span>
            </div>
          </div>
        )}
      </div>

      {/* 6. Primary Action: Full Intel */}
      {onOpenDetails && (
        <button
          onClick={() => onOpenDetails(disaster)}
          className="popup-btn-full-intel"
          title="Open comprehensive verified incident details"
        >
          <FileText size={14} />
          <span>Full Intel Report</span>
          <Sparkles size={13} className="sparkle-icon" />
        </button>
      )}

      {/* 7. Action Button Toolbar */}
      <div className="popup-actions-grid">
        {onOpenSurvivalAcademy && (
          <button
            onClick={() => onOpenSurvivalAcademy(type)}
            className="popup-action-tile survival-tile"
            title="Learn how to survive this disaster"
          >
            <GraduationCap size={14} />
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
          className="popup-action-tile weather-tile"
          title="Check real-time meteorological weather"
        >
          <CloudSun size={14} />
          <span>Weather</span>
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
            className="popup-action-tile facilities-tile"
            title="Discover nearby emergency facilities"
          >
            <Building2 size={14} />
            <span>Facilities</span>
          </button>
        )}

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="popup-action-tile nav-tile"
          title="Open directions in Google Maps"
        >
          <Navigation size={14} />
          <span>Navigate</span>
        </a>
      </div>

      {/* 8. Footer Info */}
      <div className="popup-footer">
        <div className="popup-source-tag">
          <span className="source-label">Source:</span>
          <strong>{isSachet ? 'NDMA SACHET' : source || 'DisasterShield'}</strong>
          {status && <span className={`status-pill status-${status}`}>{status}</span>}
        </div>

        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="popup-link-btn"
            title="View official agency report"
          >
            <span>Official Report</span>
            <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
};

export default DisasterPopup;
