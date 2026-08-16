import React, { useMemo } from 'react';
import { Marker, Circle } from '@react-google-maps/api';

// Color & emoji palette for disaster markers
export const typeConfig = {
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

export const severityStyles = {
  critical: { strokeColor: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.22, strokeWeight: 2 },
  high: { strokeColor: '#ea580c', fillColor: '#f97316', fillOpacity: 0.18, strokeWeight: 1.8 },
  medium: { strokeColor: '#ca8a04', fillColor: '#eab308', fillOpacity: 0.15, strokeWeight: 1.5 },
  low: { strokeColor: '#16a34a', fillColor: '#22c55e', fillOpacity: 0.12, strokeWeight: 1.2 },
};

/**
 * Generate custom SVG icon for Google Maps Marker
 */
const createMarkerIcon = (type, severity, isSelected) => {
  const config = typeConfig[type?.toLowerCase()] || typeConfig.other;
  const sev = severity?.toLowerCase() || 'medium';
  const color = config.color;
  const size = isSelected ? 42 : 34;
  const radius = size / 2;
  const innerRadius = isSelected ? 14 : 11;
  const haloOpacity = isSelected ? 0.45 : 0.2;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${radius}" cy="${radius}" r="${radius - 2}" fill="${color}" fill-opacity="${haloOpacity}" stroke="${color}" stroke-width="${isSelected ? 3 : 1.5}"/>
      <circle cx="${radius}" cy="${radius}" r="${innerRadius}" fill="${color}" stroke="#ffffff" stroke-width="${isSelected ? 2.5 : 1.5}"/>
      <text x="${radius}" y="${radius + (isSelected ? 5 : 4)}" font-size="${isSelected ? 14 : 11}" text-anchor="middle">${config.emoji}</text>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: typeof window !== 'undefined' && window.google ? new window.google.maps.Size(size, size) : undefined,
    anchor: typeof window !== 'undefined' && window.google ? new window.google.maps.Point(radius, radius) : undefined,
  };
};

export const DisasterMarker = ({ disaster, isSelected, onClick, showRadius = true }) => {
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
  if (
    latitude === null ||
    longitude === null ||
    latitude === undefined ||
    longitude === undefined ||
    isNaN(Number(latitude)) ||
    isNaN(Number(longitude))
  ) {
    return null;
  }

  const position = {
    lat: Number(latitude),
    lng: Number(longitude),
  };

  // Convert affectedRadius (km) to meters for Google Maps Circle
  const radiusInMeters = Math.max(1000, Number(affectedRadius || 10) * 1000);

  const markerIcon = useMemo(
    () => createMarkerIcon(type, severity, isSelected),
    [type, severity, isSelected]
  );

  const circleStyle = severityStyles[severity?.toLowerCase()] || severityStyles.medium;

  return (
    <>
      {/* Affected Impact Radius Circle */}
      {showRadius && (
        <Circle
          center={position}
          radius={radiusInMeters}
          options={{
            strokeColor: isSelected ? '#38bdf8' : circleStyle.strokeColor,
            strokeOpacity: isSelected ? 0.9 : 0.6,
            strokeWeight: isSelected ? 2.5 : circleStyle.strokeWeight,
            fillColor: circleStyle.fillColor,
            fillOpacity: isSelected ? 0.35 : circleStyle.fillOpacity,
            clickable: false,
            zIndex: isSelected ? 10 : 1,
          }}
        />
      )}

      {/* Disaster Marker */}
      <Marker
        position={position}
        icon={markerIcon}
        title={title || `${type} disaster`}
        zIndex={isSelected ? 100 : 10}
        onClick={() => {
          if (onClick) onClick(disaster);
        }}
      />
    </>
  );
};

export default DisasterMarker;
