import React, { useState } from 'react';
import { Marker, Circle, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Loader2, AlertCircle } from 'lucide-react';

// Custom pulsing blue icon for user location
const userLocationIcon = L.divIcon({
  className: 'custom-user-location-marker',
  html: `
    <div class="user-marker-pulse">
      <div class="user-marker-radar"></div>
      <div class="user-marker-center"></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

/**
 * Subcomponent to fly the map to the user's location
 */
const LocationFlyTo = ({ coords }) => {
  const map = useMap();
  React.useEffect(() => {
    if (coords) {
      map.flyTo([coords.latitude, coords.longitude], 10, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [coords, map]);
  return null;
};

export const UserLocation = ({ userCoords, onLocationFound }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

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
        onLocationFound({ latitude, longitude, accuracy });
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

  return (
    <>
      {/* Geolocation Button in UI */}
      <div className="user-location-control">
        <button
          onClick={handleLocateMe}
          disabled={loading}
          className={`locate-btn ${userCoords ? 'active' : ''}`}
          title="Find my current location"
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
      {userCoords && (
        <>
          <LocationFlyTo coords={userCoords} />

          {/* User Location Marker */}
          <Marker
            position={[userCoords.latitude, userCoords.longitude]}
            icon={userLocationIcon}
          >
            <Popup className="user-leaflet-popup">
              <div className="user-popup-content">
                <strong>📍 Your Current Location</strong>
                <p>Lat: {userCoords.latitude.toFixed(4)}, Lng: {userCoords.longitude.toFixed(4)}</p>
                {userCoords.accuracy && (
                  <small>Accuracy: ~{Math.round(userCoords.accuracy)}m</small>
                )}
              </div>
            </Popup>
          </Marker>

          {/* Accuracy circle */}
          <Circle
            center={[userCoords.latitude, userCoords.longitude]}
            radius={Math.max(1000, userCoords.accuracy || 2000)}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#60a5fa',
              fillOpacity: 0.15,
              weight: 1.5,
              dashArray: '3, 6',
            }}
          />
        </>
      )}
    </>
  );
};

export default UserLocation;
