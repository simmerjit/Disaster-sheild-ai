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

      {/* Title */}
      <h3 className="popup-title">{title}</h3>

      {/* SACHET Official Alert Tag */}
      {isSachet && (
        <div className="sachet-official-tag">
          <span>Official NDMA SACHET Alert</span>
          {sender && <small> &bull; {sender}</small>}
        </div>
      )}

      {/* Description */}
      {description && <p className="popup-description">{description}</p>}

      {/* Emergency Instruction (SACHET CAP) */}
      {instruction && (
        <div className="popup-instruction-box">
          <strong>⚠️ Official Instruction:</strong> {instruction}
        </div>
      )}

      {/* Key Details Grid */}
      <div className="popup-details-grid">
        {/* Location / Affected Area */}
        <div className="popup-detail-item">
          <MapPin size={14} className="popup-icon" />
          <span>
            <strong>{isSachet ? 'Affected Area:' : 'Location:'}</strong> {location || country || 'India'}
          </span>
        </div>

        {/* Coordinates */}
        <div className="popup-detail-item">
          <Activity size={14} className="popup-icon" />
          <span>
            <strong>Coords:</strong> {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
          </span>
        </div>

        {/* Magnitude & Depth */}
        {magnitude !== null && magnitude !== undefined && (
          <div className="popup-detail-item">
            <AlertTriangle size={14} className="popup-icon" />
            <span>
              <strong>Magnitude:</strong> {magnitude} {depth ? `(Depth: ${depth} km)` : ''}
            </span>
          </div>
        )}

        {/* Affected Radius */}
        <div className="popup-detail-item">
          <Layers size={14} className="popup-icon" />
          <span>
            <strong>Impact Radius:</strong> ~{radiusKm} km ({radiusMeters.toLocaleString()} m)
          </span>
        </div>

        {/* Date & Time */}
        <div className="popup-detail-item">
          <Calendar size={14} className="popup-icon" />
          <span>
            <strong>Effective:</strong> {effective ? new Date(effective).toLocaleString() : formattedDate}
          </span>
        </div>

        {/* Expiry if available */}
        {expires && (
          <div className="popup-detail-item">
            <Calendar size={14} className="popup-icon" />
            <span>
              <strong>Expires:</strong> {new Date(expires).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons: Weather, Navigation, Nearby Facilities, Incident Details */}
      <div className="popup-quick-actions">
        {onOpenDetails && (
          <button
            onClick={() => onOpenDetails(disaster)}
            className="popup-action-btn details-action"
            title="Open Full Incident Details & Impact Panel"
          >
            <span>📑 Details & Relief</span>
          </button>
        )}

        <button
          onClick={() => {
            if (onOpenWeather) {
              onOpenWeather({
                latitude: Number(latitude),
                longitude: Number(longitude),
                name: title || `${type} Event`,
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
