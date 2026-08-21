import React, { useMemo } from 'react';
import { Marker, InfoWindow } from '@react-google-maps/api';
import ShelterPopup from './ShelterPopup';

/**
 * Generate custom SVG icon data URL for Shelter marker
 * @param {boolean} isRecommended
 * @param {boolean} isSelected
 * @returns {Object}
 */
const createShelterIcon = (isRecommended, isSelected) => {
  const size = isRecommended ? (isSelected ? 46 : 40) : (isSelected ? 38 : 32);
  const radius = size / 2;
  const primaryColor = isRecommended ? '#f59e0b' : '#22c55e';
  const pulseColor = isRecommended ? '#fbbf24' : '#4ade80';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="${isRecommended ? 3 : 1.5}" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      ${
        isRecommended
          ? `<circle cx="${radius}" cy="${radius}" r="${radius - 2}" fill="${pulseColor}" fill-opacity="0.3" stroke="${pulseColor}" stroke-width="1.5" filter="url(#glow)"/>`
          : `<circle cx="${radius}" cy="${radius}" r="${radius - 3}" fill="${primaryColor}" fill-opacity="0.2" stroke="${primaryColor}" stroke-width="1"/>`
      }
      <circle cx="${radius}" cy="${radius}" r="${isRecommended ? radius - 7 : radius - 6}" fill="${primaryColor}" stroke="#ffffff" stroke-width="${isSelected ? 2.5 : 1.5}"/>
      <text x="${radius}" y="${radius + (isRecommended ? 4 : 3)}" font-size="${isRecommended ? 13 : 11}" text-anchor="middle">🏕️</text>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: typeof window !== 'undefined' && window.google ? new window.google.maps.Size(size, size) : undefined,
    anchor: typeof window !== 'undefined' && window.google ? new window.google.maps.Point(radius, radius) : undefined,
  };
};

export const ShelterMarker = ({
  shelter,
  isRecommended,
  isSelected,
  onClick,
  onClose,
  onNavigate,
  onOpenDetails,
  userCoords,
}) => {
  const latNum = Number(shelter.latitude);
  const lngNum = Number(shelter.longitude);

  const markerIcon = useMemo(
    () => createShelterIcon(isRecommended || shelter.recommended, isSelected),
    [isRecommended, shelter.recommended, isSelected]
  );

  const isValidCoords =
    shelter.latitude !== null &&
    shelter.longitude !== null &&
    !isNaN(latNum) &&
    !isNaN(lngNum);

  if (!isValidCoords) return null;

  const position = { lat: latNum, lng: lngNum };

  return (
    <>
      <Marker
        position={position}
        icon={markerIcon}
        title={`🏕️ ${shelter.name} ${isRecommended ? '⭐ [RECOMMENDED]' : ''}`}
        zIndex={isRecommended ? 300 : isSelected ? 200 : 80}
        onClick={() => {
          if (onClick) onClick(shelter);
        }}
      />

      {isSelected && (
        <InfoWindow
          position={position}
          onCloseClick={onClose}
          options={{
            pixelOffset: new window.google.maps.Size(0, -18),
          }}
        >
          <ShelterPopup
            shelter={shelter}
            isRecommended={isRecommended || shelter.recommended}
            onNavigate={onNavigate}
            onOpenDetails={onOpenDetails}
            userCoords={userCoords}
            onClose={onClose}
          />
        </InfoWindow>
      )}
    </>
  );
};

export default ShelterMarker;
