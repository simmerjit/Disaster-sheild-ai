import React, { useMemo } from 'react';
import { Marker, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import DisasterPopup from './DisasterPopup';

// Color & emoji palette for disaster markers
const typeConfig = {
  earthquake: { color: '#ef4444', emoji: '🔴', label: 'Earthquake' },
  cyclone: { color: '#f97316', emoji: '🟠', label: 'Cyclone' },
  flood: { color: '#3b82f6', emoji: '🔵', label: 'Flood' },
  wildfire: { color: '#f43f5e', emoji: '🔥', label: 'Wildfire' },
  volcano: { color: '#a855f7', emoji: '🟣', label: 'Volcano' },
  drought: { color: '#eab308', emoji: '🌾', label: 'Drought' },
  tsunami: { color: '#06b6d4', emoji: '🌊', label: 'Tsunami' },
  storm: { color: '#64748b', emoji: '⛈️', label: 'Storm' },
  landslide: { color: '#78350f', emoji: '⛰️', label: 'Landslide' },
  other: { color: '#eab308', emoji: '⚠️', label: 'Disaster' },
};

const severityStyles = {
  critical: { color: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.22, weight: 2 },
  high: { color: '#ea580c', fillColor: '#f97316', fillOpacity: 0.18, weight: 1.8 },
  medium: { color: '#ca8a04', fillColor: '#eab308', fillOpacity: 0.15, weight: 1.5 },
  low: { color: '#16a34a', fillColor: '#22c55e', fillOpacity: 0.12, weight: 1.2 },
};

/**
 * Creates custom HTML marker icon for each disaster
 */
const createDisasterIcon = (type, severity, title) => {
  const config = typeConfig[type?.toLowerCase()] || typeConfig.other;
  const sev = severity?.toLowerCase() || 'medium';

  return L.divIcon({
    className: 'custom-disaster-marker',
    html: `
      <div class="marker-pulse-wrapper sev-${sev}">
        <div class="marker-glow-ring" style="border-color: ${config.color};"></div>
        <div class="marker-pin" style="background-color: ${config.color};" title="${title || ''}">
          <span class="marker-emoji">${config.emoji}</span>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

export const DisasterMarker = ({ disaster, isSelected, onClick }) => {
  const {
    id,
    title,
    type = 'other',
    severity = 'medium',
    latitude,
    longitude,
    affectedRadius = 10,
  } = disaster;

  // Validate coordinates
  if (latitude === null || longitude === null || isNaN(latitude) || isNaN(longitude)) {
    return null;
  }

  const position = [latitude, longitude];

  // Convert affected radius from kilometers to meters (Leaflet requirement)
  const radiusInMeters = Math.max(1000, Number(affectedRadius || 10) * 1000);

  const customIcon = useMemo(
    () => createDisasterIcon(type, severity, title),
    [type, severity, title]
  );

  const circleStyle = severityStyles[severity?.toLowerCase()] || severityStyles.medium;

  return (
    <>
      {/* Affected Impact Radius Circle */}
      <Circle
        center={position}
        radius={radiusInMeters}
        pathOptions={{
          color: circleStyle.color,
          fillColor: circleStyle.fillColor,
          fillOpacity: isSelected ? 0.35 : circleStyle.fillOpacity,
          weight: isSelected ? 3 : circleStyle.weight,
          dashArray: isSelected ? '4, 4' : undefined,
        }}
      />

      {/* Disaster Location Marker */}
      <Marker
        position={position}
        icon={customIcon}
        eventHandlers={{
          click: () => {
            if (onClick) onClick(disaster);
          },
        }}
      >
        <Popup className="disaster-leaflet-popup" minWidth={280} maxWidth={340}>
          <DisasterPopup disaster={disaster} />
        </Popup>
      </Marker>
    </>
  );
};

export default DisasterMarker;
