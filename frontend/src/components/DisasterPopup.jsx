import React from 'react';
import { ExternalLink, MapPin, Activity, Calendar, Layers, AlertTriangle } from 'lucide-react';

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

export const DisasterPopup = ({ disaster }) => {
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
  } = disaster;

  const emoji = typeEmojis[type.toLowerCase()] || '⚠️';
  const sevColor = severityColors[severity.toLowerCase()] || '#eab308';
  const formattedDate = timestamp ? new Date(timestamp).toLocaleString() : 'N/A';

  return (
    <div className="disaster-popup-content">
      {/* Header */}
      <div className="popup-header">
        <div className="popup-type-badge">
          <span className="popup-emoji">{emoji}</span>
          <span className="popup-type-text">{type.toUpperCase()}</span>
        </div>
        <span
          className="popup-severity-badge"
          style={{ backgroundColor: `${sevColor}20`, color: sevColor, borderColor: sevColor }}
        >
          {severity.toUpperCase()}
        </span>
      </div>

      {/* Title */}
      <h3 className="popup-title">{title}</h3>

      {/* Description */}
      {description && <p className="popup-description">{description}</p>}

      {/* Key Details Grid */}
      <div className="popup-details-grid">
        {/* Location */}
        <div className="popup-detail-item">
          <MapPin size={14} className="popup-icon" />
          <span>
            <strong>Location:</strong> {location || country || 'Global Coordinates'}
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
        {affectedRadius && (
          <div className="popup-detail-item">
            <Layers size={14} className="popup-icon" />
            <span>
              <strong>Radius:</strong> ~{affectedRadius} km ({affectedRadius * 1000} m)
            </span>
          </div>
        )}

        {/* Date & Time */}
        <div className="popup-detail-item">
          <Calendar size={14} className="popup-icon" />
          <span>
            <strong>Date:</strong> {formattedDate}
          </span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="popup-footer">
        <div className="popup-source-tag">
          Source: <strong>{source || 'Backend API'}</strong>
          {status && <span className={`status-pill status-${status}`}>{status}</span>}
        </div>

        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="popup-link-btn"
            title="View full official report"
          >
            <span>Details</span>
            <ExternalLink size={13} />
          </a>
        )}
      </div>
    </div>
  );
};

export default DisasterPopup;
