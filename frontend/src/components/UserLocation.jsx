import React, { useState, useMemo } from 'react';
import { Marker, Circle, InfoWindow } from '@react-google-maps/api';
import { Navigation, Loader2, AlertCircle } from 'lucide-react';

/**
 * Custom SVG icon for User Location pin with pulsing blue radar design
 */
const createUserLocationIcon = () => {
  const size = 32;
  const radius = size / 2;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${radius}" cy="${radius}" r="14" fill="#3b82f6" fill-opacity="0.25" stroke="#60a5fa" stroke-width="1.5"/>
      <circle cx="${radius}" cy="${radius}" r="7" fill="#2563eb" stroke="#ffffff" stroke-width="2"/>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: typeof window !== 'undefined' && window.google ? new window.google.maps.Size(size, size) : undefined,
    anchor: typeof window !== 'undefined' && window.google ? new window.google.maps.Point(radius, radius) : undefined,
  };
};

export const UserLocation = ({ map, userCoords, onLocationFound }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLoading(false);
        const { latitude, longitude, accuracy } = position.coords;
        const coords = { latitude, longitude, accuracy };
        onLocationFound(coords);

        if (map) {
          map.panTo({ lat: latitude, lng: longitude });
          map.setZoom(10);
        }
      },
      (err) => {
        setLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setErrorMsg('Location access was denied.');
            break;
          case err.POSITION_UNAVAILABLE:
            setErrorMsg('Location information is unavailable.');
            break;
          case err.TIMEOUT:
            setErrorMsg('Location request timed out.');
            break;
          default:
            setErrorMsg('An error occurred getting your location.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const userIcon = useMemo(() => createUserLocationIcon(), []);

  const userPos = userCoords
    ? { lat: Number(userCoords.latitude), lng: Number(userCoords.longitude) }
    : null;

  return (
    <>
      {/* UI Control Button */}
      <div className="user-location-control">
        <button
          onClick={handleLocateMe}
          disabled={loading}
          className={`locate-btn ${userCoords ? 'active' : ''}`}
          title="Find and center on my current location"
        >
          {loading ? (
            <Loader2 size={16} className="spin-icon" />
          ) : (
            <Navigation size={16} className="locate-icon" />
          )}
          <span>{userCoords ? 'Centered on You' : 'My Location'}</span>
        </button>

        {errorMsg && (
          <div className="location-error-tooltip">
            <AlertCircle size={14} />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Render user marker and accuracy radius on map if location exists */}
      {userPos && (
        <>
          {/* User accuracy circle */}
          <Circle
            center={userPos}
            radius={Math.max(1000, Number(userCoords.accuracy || 2000))}
            options={{
              strokeColor: '#3b82f6',
              strokeOpacity: 0.6,
              strokeWeight: 1.5,
              fillColor: '#60a5fa',
              fillOpacity: 0.15,
              clickable: false,
              zIndex: 5,
            }}
          />

          {/* User Location Marker */}
          <Marker
            position={userPos}
            icon={userIcon}
            title="Your Current Location"
            zIndex={200}
            onClick={() => setShowInfo(true)}
          />

          {showInfo && (
            <InfoWindow
              position={userPos}
              onCloseClick={() => setShowInfo(false)}
            >
              <div className="user-popup-content">
                <strong>📍 Your Current Location</strong>
                <p>
                  Lat: {userCoords.latitude.toFixed(4)}, Lng: {userCoords.longitude.toFixed(4)}
                </p>
                {userCoords.accuracy && (
                  <small>Accuracy: ~{Math.round(userCoords.accuracy)}m</small>
                )}
              </div>
            </InfoWindow>
          )}
        </>
      )}
    </>
  );
};

export default UserLocation;
