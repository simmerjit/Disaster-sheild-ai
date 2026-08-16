import React, { useState, useEffect, useCallback } from 'react';
import {
  Hospital,
  Shield,
  Flame,
  Pill,
  Stethoscope,
  Activity,
  MapPin,
  Star,
  ExternalLink,
  Navigation,
  RefreshCw,
  X,
  AlertCircle,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { fetchNearbyFacilities, FACILITY_TYPES } from '../services/placesApi';
import { formatDistance, calculateDistanceKm, getGoogleMapsDirectionsUrl } from '../utils/geoUtils';

const radiusOptions = [
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
  { value: 25000, label: '25 km' },
  { value: 50000, label: '50 km' },
];

export const NearbyFacilitiesPanel = ({
  searchOrigin, // { latitude, longitude, name, type }
  facilities = [],
  onFacilitiesLoaded,
  selectedFacility,
  onSelectFacility,
  onClose,
  userCoords,
}) => {
  const [selectedType, setSelectedType] = useState('hospital');
  const [selectedRadius, setSelectedRadius] = useState(5000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const searchFacilities = useCallback(async () => {
    if (!searchOrigin || searchOrigin.latitude === null || searchOrigin.longitude === null) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetchNearbyFacilities({
        latitude: searchOrigin.latitude,
        longitude: searchOrigin.longitude,
        radius: selectedRadius,
        type: selectedType,
      });

      if (response && response.data) {
        onFacilitiesLoaded(response.data);
        setHasSearched(true);
      } else {
        throw new Error('Invalid response structure from server');
      }
    } catch (err) {
      console.error('Failed to load nearby facilities:', err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'Failed to load nearby facilities from Google Places.'
      );
    } finally {
      setLoading(false);
    }
  }, [searchOrigin, selectedRadius, selectedType, onFacilitiesLoaded]);

  // Trigger search on mount or when searchOrigin/type/radius changes
  useEffect(() => {
    if (searchOrigin && searchOrigin.latitude && searchOrigin.longitude) {
      searchFacilities();
    }
  }, [searchOrigin?.latitude, searchOrigin?.longitude, selectedType, selectedRadius]);

  const userLat = userCoords ? Number(userCoords.latitude) : null;
  const userLng = userCoords ? Number(userCoords.longitude) : null;

  return (
    <div className="nearby-facilities-panel">
      {/* Header */}
      <div className="facilities-panel-header">
        <div className="panel-title-block">
          <div className="title-row">
            <Hospital size={16} className="title-icon" />
            <h3>Nearby Emergency Facilities</h3>
          </div>
          <span className="source-tag">Google Places Discovery</span>
        </div>

        <button onClick={onClose} className="panel-close-btn" title="Close facilities panel">
          <X size={15} />
        </button>
      </div>

      {/* Search Origin Badge */}
      {searchOrigin && (
        <div className="search-origin-bar">
          <MapPin size={12} className="origin-pin" />
          <span className="origin-text">
            Search Center: <strong>{searchOrigin.name || 'Selected Location'}</strong>
          </span>
          <span className="origin-coords">
            ({Number(searchOrigin.latitude).toFixed(2)}°, {Number(searchOrigin.longitude).toFixed(2)}°)
          </span>
        </div>
      )}

      {/* Safety Notice: Verified Shelters vs Google Places Distinction */}
      <div className="facilities-notice-banner">
        <ShieldAlert size={14} className="notice-icon" />
        <div className="notice-text">
          <strong>Secondary Discovery Layer:</strong> These are public facilities found via Google Places. For certified disaster safe havens, refer to <strong>Verified Shelters</strong>.
        </div>
      </div>

      {/* Facility Type Tabs */}
      <div className="facility-type-tabs">
        {FACILITY_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`type-tab-btn ${selectedType === type.id ? 'active' : ''}`}
            title={`Search nearby ${type.label}`}
          >
            <span>{type.emoji}</span>
            <span className="tab-label">{type.label}</span>
          </button>
        ))}
      </div>

      {/* Search Controls: Radius & Refresh */}
      <div className="facility-search-controls">
        <div className="radius-selector-group">
          <label>Radius:</label>
          <div className="radius-pills">
            {radiusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedRadius(opt.value)}
                className={`radius-pill ${selectedRadius === opt.value ? 'active' : ''}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={searchFacilities}
          disabled={loading}
          className="search-sync-btn"
          title="Refresh search"
        >
          <RefreshCw size={13} className={loading ? 'spin-icon' : ''} />
          <span>{loading ? 'Searching...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Facilities Feed List */}
      <div className="facilities-list-body">
        {loading && (
          <div className="facilities-loading-box">
            <RefreshCw size={20} className="spin-icon" />
            <p>Searching Google Places for nearby {selectedType.replace('_', ' ')}s...</p>
          </div>
        )}

        {error && !loading && (
          <div className="facilities-error-box">
            <AlertCircle size={18} />
            <p>{error}</p>
            <button onClick={searchFacilities} className="error-retry-btn">
              Retry Search
            </button>
          </div>
        )}

        {!loading && !error && facilities.length === 0 && hasSearched && (
          <div className="facilities-empty-state">
            <Search size={24} className="empty-search-icon" />
            <h4>No {selectedType.replace('_', ' ')}s found</h4>
            <p>No facilities were found within {selectedRadius / 1000} km. Try increasing the search radius to 25 km or 50 km.</p>
          </div>
        )}

        {!loading &&
          !error &&
          facilities.map((place) => {
            const isSel = selectedFacility?.id === place.id;
            const placeLat = Number(place.latitude);
            const placeLng = Number(place.longitude);

            // Calculate distance from search center
            const distFromOrigin =
              searchOrigin && searchOrigin.latitude && searchOrigin.longitude
                ? calculateDistanceKm(
                    Number(searchOrigin.latitude),
                    Number(searchOrigin.longitude),
                    placeLat,
                    placeLng
                  )
                : null;

            const directionsUrl = getGoogleMapsDirectionsUrl(
              userLat,
              userLng,
              placeLat,
              placeLng
            );

            return (
              <div
                key={place.id}
                onClick={() => onSelectFacility(place)}
                className={`facility-card ${isSel ? 'selected' : ''}`}
              >
                <div className="facility-card-header">
                  <h4 className="facility-name">{place.name}</h4>
                  {distFromOrigin !== null && (
                    <span className="facility-distance-badge">
                      📍 {formatDistance(distFromOrigin)}
                    </span>
                  )}
                </div>

                <div className="facility-card-address">
                  <MapPin size={12} className="meta-icon" />
                  <span>{place.address}</span>
                </div>

                <div className="facility-card-footer">
                  <div className="facility-footer-meta">
                    {place.rating !== null && (
                      <span className="rating-badge">
                        <Star size={11} className="star-icon" />
                        <span>{place.rating.toFixed(1)}</span>
                      </span>
                    )}
                    <span className="facility-type-pill">{place.type?.replace('_', ' ')}</span>
                  </div>

                  <div className="facility-actions-row" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="facility-nav-link"
                      title="Open directions in Google Maps"
                    >
                      <Navigation size={11} />
                      <span>Directions</span>
                    </a>

                    {place.googleMapsUri && (
                      <a
                        href={place.googleMapsUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="facility-gmaps-link"
                        title="View on Google Maps"
                      >
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Panel Footer */}
      <div className="facilities-panel-footer">
        <span>Found {facilities.length} facilities within {selectedRadius / 1000} km</span>
      </div>
    </div>
  );
};

export default NearbyFacilitiesPanel;
