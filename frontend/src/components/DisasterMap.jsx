import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import { darkMapStyle } from '../utils/mapStyles';
import DisasterMarker from './DisasterMarker';
import DisasterPopup from './DisasterPopup';
import UserLocation from './UserLocation';
import WeatherWidget from './WeatherWidget';
import NavigationTool from './NavigationTool';
import {
  Maximize2,
  Compass,
  Layers,
  ZoomIn,
  ZoomOut,
  Map as MapIcon,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  CloudSun,
  Route,
  Navigation,
  HelpCircle,
} from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 20.0,
  lng: 0.0,
};

const defaultZoom = 3;

const googleMapsLibraries = [];

export const DisasterMap = ({
  disasters = [],
  selectedDisaster,
  onSelectDisaster,
  userCoords,
  onLocationFound,
  weatherTarget,
  onSetWeatherTarget,
  showNavTool,
  onToggleNavTool,
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: googleMapsLibraries,
  });

  const [map, setMap] = useState(null);
  const [mapTypeId, setMapTypeId] = useState('roadmap'); // 'roadmap' | 'satellite' | 'hybrid' | 'terrain'
  const [useDarkTheme, setUseDarkTheme] = useState(true);
  const [showRadiusCircles, setShowRadiusCircles] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [weatherInspectorActive, setWeatherInspectorActive] = useState(false);

  // Future-ready layers state
  const [activeLayers, setActiveLayers] = useState({
    disasters: true,
    shelters: false,
    rainfall: false,
    lightning: false,
    cyclones: false,
    heatwave: false,
    weather: false,
  });

  // Track map load
  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Smoothly pan and zoom to selected disaster
  useEffect(() => {
    if (map && selectedDisaster) {
      const lat = Number(selectedDisaster.latitude);
      const lng = Number(selectedDisaster.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        map.panTo({ lat, lng });
        if (map.getZoom() < 6) {
          map.setZoom(7);
        }
      }
    }
  }, [map, selectedDisaster]);

  // Fit all visible disasters on map
  const handleFitBounds = useCallback(() => {
    if (!map || !window.google || disasters.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    let hasValid = false;

    disasters.forEach((d) => {
      const lat = Number(d.latitude);
      const lng = Number(d.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        bounds.extend({ lat, lng });
        hasValid = true;
      }
    });

    if (hasValid) {
      map.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
    }
  }, [map, disasters]);

  // Reset to default world view
  const handleResetView = useCallback(() => {
    if (!map) return;
    map.panTo(defaultCenter);
    map.setZoom(defaultZoom);
  }, [map]);

  // Zoom controls
  const handleZoomIn = () => {
    if (map) map.setZoom(map.getZoom() + 1);
  };

  const handleZoomOut = () => {
    if (map) map.setZoom(Math.max(2, map.getZoom() - 1));
  };

  // Toggle layers
  const toggleLayer = (layerName) => {
    setActiveLayers((prev) => ({
      ...prev,
      [layerName]: !prev[layerName],
    }));
  };

  // Handle map click for weather inspection
  const handleMapClick = (e) => {
    if (weatherInspectorActive && e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      if (onSetWeatherTarget) {
        onSetWeatherTarget({
          latitude: lat,
          longitude: lng,
          name: `Point (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`,
          type: 'weather_point',
        });
      }
    }
  };

  // Map options configuration
  const mapOptions = useMemo(
    () => ({
      styles: useDarkTheme && mapTypeId === 'roadmap' ? darkMapStyle : undefined,
      mapTypeId: mapTypeId,
      disableDefaultUI: true,
      zoomControl: false,
      mapTypeControl: false,
      scaleControl: true,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false,
      backgroundColor: '#0f172a',
      minZoom: 2,
      maxZoom: 18,
      gestureHandling: 'greedy',
      draggableCursor: weatherInspectorActive ? 'crosshair' : undefined,
    }),
    [useDarkTheme, mapTypeId, weatherInspectorActive]
  );

  // Fallback: If no Google Maps API Key is configured in .env
  if (!apiKey) {
    return (
      <div className="map-wrapper no-key-fallback">
        <div className="api-key-banner">
          <div className="api-key-header">
            <KeyRound size={28} className="key-icon" />
            <h3>Google Maps API Key Required</h3>
          </div>
          <p>
            To display the live interactive Google Map, add your Google Maps API Key to your frontend environment file:
          </p>
          <div className="code-snippet">
            <code>frontend/.env</code>
            <pre>VITE_GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key_here</pre>
          </div>
          <div className="key-steps">
            <strong>Quick Setup:</strong>
            <ol>
              <li>Go to <a href="https://console.cloud.google.com/google/maps-apis" target="_blank" rel="noreferrer">Google Cloud Console &rarr; Maps JavaScript API</a></li>
              <li>Create or copy your API key</li>
              <li>Save it in <code>frontend/.env</code> under <code>VITE_GOOGLE_MAPS_API_KEY</code></li>
              <li>Restart Vite dev server or refresh this page</li>
            </ol>
          </div>
          <div className="fallback-disaster-list">
            <strong>Disaster Feed Available:</strong> {disasters.length} live disaster events currently loaded in the sidebar.
          </div>
        </div>
      </div>
    );
  }

  // Handle Load Error
  if (loadError) {
    return (
      <div className="map-wrapper map-error-fallback">
        <div className="api-key-banner">
          <AlertCircle size={28} className="error-icon" />
          <h3>Error Loading Google Maps</h3>
          <p>{loadError.message || 'Unable to authenticate with Google Maps JavaScript API. Please check your API Key and domain restrictions.'}</p>
        </div>
      </div>
    );
  }

  // Loading state while script loads
  if (!isLoaded) {
    return (
      <div className="map-wrapper map-loading-state">
        <div className="loading-box">
          <div className="spin-icon">🌐</div>
          <p>Loading Google Maps JavaScript API...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-wrapper">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={defaultZoom}
        options={mapOptions}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
      >
        {/* User Geolocation Controls & Marker */}
        <UserLocation
          map={map}
          userCoords={userCoords}
          onLocationFound={onLocationFound}
        />

        {/* Disaster Event Markers & Impact Radii */}
        {activeLayers.disasters &&
          disasters.map((disaster) => (
            <DisasterMarker
              key={disaster.id}
              disaster={disaster}
              isSelected={selectedDisaster?.id === disaster.id}
              onClick={onSelectDisaster}
              showRadius={showRadiusCircles}
            />
          ))}

        {/* Selected Disaster Info Window */}
        {selectedDisaster &&
          selectedDisaster.latitude !== null &&
          selectedDisaster.longitude !== null && (
            <InfoWindow
              position={{
                lat: Number(selectedDisaster.latitude),
                lng: Number(selectedDisaster.longitude),
              }}
              onCloseClick={() => onSelectDisaster(null)}
              options={{
                pixelOffset: new window.google.maps.Size(0, -20),
              }}
            >
              <DisasterPopup
                disaster={selectedDisaster}
                userCoords={userCoords}
                onOpenWeather={onSetWeatherTarget}
                onOpenNavigation={() => {
                  if (onToggleNavTool) onToggleNavTool(true);
                }}
              />
            </InfoWindow>
          )}
      </GoogleMap>

      {/* Floating Map Custom Controls Bar */}
      <div className="map-floating-controls">
        {/* Zoom In/Out */}
        <div className="control-btn-group">
          <button onClick={handleZoomIn} className="map-ctrl-btn" title="Zoom In (+)">
            <ZoomIn size={16} />
          </button>
          <button onClick={handleZoomOut} className="map-ctrl-btn" title="Zoom Out (-)">
            <ZoomOut size={16} />
          </button>
        </div>

        {/* Fit Bounds / Center View */}
        <div className="control-btn-group">
          <button onClick={handleFitBounds} className="map-ctrl-btn" title="Fit All Disasters in View">
            <Maximize2 size={16} />
          </button>
          <button onClick={handleResetView} className="map-ctrl-btn" title="Reset World View">
            <Compass size={16} />
          </button>
        </div>

        {/* Weather Tool Trigger */}
        <button
          onClick={() => {
            if (weatherTarget) {
              onSetWeatherTarget(null);
            } else {
              // Open for selected disaster, or user location, or center of map
              if (selectedDisaster) {
                onSetWeatherTarget({
                  latitude: Number(selectedDisaster.latitude),
                  longitude: Number(selectedDisaster.longitude),
                  name: selectedDisaster.title,
                  type: selectedDisaster.type,
                });
              } else if (userCoords) {
                onSetWeatherTarget({
                  latitude: Number(userCoords.latitude),
                  longitude: Number(userCoords.longitude),
                  name: 'Your Current Location',
                  type: 'user_location',
                });
              } else if (map) {
                const center = map.getCenter();
                if (center) {
                  onSetWeatherTarget({
                    latitude: center.lat(),
                    longitude: center.lng(),
                    name: 'Map Center Position',
                    type: 'map_center',
                  });
                }
              }
            }
          }}
          className={`map-ctrl-btn weather-tool-btn ${weatherTarget ? 'active' : ''}`}
          title="Toggle Live Weather HUD"
        >
          <CloudSun size={17} />
        </button>

        {/* Navigation & Evacuation Tool Trigger */}
        <button
          onClick={() => {
            if (onToggleNavTool) onToggleNavTool(!showNavTool);
          }}
          className={`map-ctrl-btn nav-tool-btn ${showNavTool ? 'active' : ''}`}
          title="Toggle Evacuation & Navigation Tool"
        >
          <Route size={16} />
        </button>

        {/* Weather Inspector Click-to-Inspect Mode */}
        <button
          onClick={() => setWeatherInspectorActive(!weatherInspectorActive)}
          className={`map-ctrl-btn inspector-btn ${weatherInspectorActive ? 'active-pulse' : ''}`}
          title={
            weatherInspectorActive
              ? 'Weather Inspector Active (Click map to read weather)'
              : 'Activate Weather Inspector (Click anywhere on map)'
          }
        >
          <HelpCircle size={16} />
        </button>

        {/* Radius Toggle */}
        <button
          onClick={() => setShowRadiusCircles(!showRadiusCircles)}
          className={`map-ctrl-btn ${showRadiusCircles ? 'active' : ''}`}
          title={showRadiusCircles ? 'Hide impact radii' : 'Show impact radii'}
        >
          {showRadiusCircles ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>

        {/* Map Type / Theme Selector */}
        <div className="map-type-dropdown">
          <button
            onClick={() => {
              const types = ['roadmap', 'satellite', 'hybrid', 'terrain'];
              const nextIdx = (types.indexOf(mapTypeId) + 1) % types.length;
              setMapTypeId(types[nextIdx]);
            }}
            className="map-ctrl-btn map-type-btn"
            title={`Map type: ${mapTypeId.toUpperCase()} (Click to toggle)`}
          >
            <MapIcon size={16} />
            <span className="type-label">{mapTypeId.slice(0, 3).toUpperCase()}</span>
          </button>
        </div>

        {/* Layers Overlay Toggle */}
        <button
          onClick={() => setShowLayersMenu(!showLayersMenu)}
          className={`map-ctrl-btn ${showLayersMenu ? 'active' : ''}`}
          title="Toggle data layers"
        >
          <Layers size={16} />
        </button>
      </div>

      {/* Weather Inspector Status Banner */}
      {weatherInspectorActive && (
        <div className="inspector-banner">
          <span>🎯 Weather Inspector Active: Click anywhere on map to fetch live weather</span>
          <button onClick={() => setWeatherInspectorActive(false)}>&times;</button>
        </div>
      )}

      {/* Live Weather HUD Widget */}
      {weatherTarget && (
        <WeatherWidget
          targetLocation={weatherTarget}
          onClose={() => onSetWeatherTarget(null)}
        />
      )}

      {/* Evacuation & Navigation Tool HUD */}
      {showNavTool && (
        <NavigationTool
          userCoords={userCoords}
          selectedDisaster={selectedDisaster}
          onClose={() => onToggleNavTool(false)}
        />
      )}

      {/* Future Layers Menu Panel */}
      {showLayersMenu && (
        <div className="map-layers-panel">
          <div className="layers-header">
            <h4>Data Layers</h4>
            <span className="badge">Config</span>
          </div>
          <div className="layers-list">
            <label className="layer-item">
              <input
                type="checkbox"
                checked={activeLayers.disasters}
                onChange={() => toggleLayer('disasters')}
              />
              <span>🔴 Live Disasters (GDACS / USGS / NASA)</span>
            </label>

            <label className="layer-item future-layer">
              <input
                type="checkbox"
                checked={activeLayers.rainfall}
                onChange={() => toggleLayer('rainfall')}
              />
              <span>🌧️ Rainfall & Precipitation Radar</span>
              <span className="future-tag">Active</span>
            </label>

            <label className="layer-item future-layer">
              <input
                type="checkbox"
                checked={activeLayers.weather}
                onChange={() => toggleLayer('weather')}
              />
              <span>⛅ Synoptic Weather Observations</span>
              <span className="future-tag">Active</span>
            </label>

            <label className="layer-item future-layer">
              <input
                type="checkbox"
                checked={activeLayers.lightning}
                onChange={() => toggleLayer('lightning')}
              />
              <span>⚡ Lightning Risk Forecast</span>
              <span className="future-tag">MOSDAC</span>
            </label>

            <label className="layer-item future-layer">
              <input
                type="checkbox"
                checked={activeLayers.cyclones}
                onChange={() => toggleLayer('cyclones')}
              />
              <span>🌀 Cyclone Satellite Prediction</span>
              <span className="future-tag">MOSDAC</span>
            </label>

            <label className="layer-item future-layer">
              <input
                type="checkbox"
                checked={activeLayers.heatwave}
                onChange={() => toggleLayer('heatwave')}
              />
              <span>☀️ Heatwave Prediction</span>
              <span className="future-tag">MOSDAC</span>
            </label>

            <label className="layer-item future-layer">
              <input
                type="checkbox"
                checked={activeLayers.shelters}
                onChange={() => toggleLayer('shelters')}
              />
              <span>🏠 Emergency Shelters</span>
              <span className="future-tag">Database</span>
            </label>
          </div>
        </div>
      )}

      {/* Map Legend Overlay */}
      {showLegend && (
        <div className="map-legend-box">
          <div className="legend-header">
            <h4 className="legend-title">Disaster Legend</h4>
            <button
              onClick={() => setShowLegend(false)}
              className="legend-close-btn"
              title="Close legend"
            >
              &times;
            </button>
          </div>
          <div className="legend-grid">
            <div className="legend-item"><span className="legend-symbol">🔴</span> Earthquake</div>
            <div className="legend-item"><span className="legend-symbol">🟠</span> Cyclone</div>
            <div className="legend-item"><span className="legend-symbol">🔵</span> Flood</div>
            <div className="legend-item"><span className="legend-symbol">🔥</span> Wildfire</div>
            <div className="legend-item"><span className="legend-symbol">🟣</span> Volcano</div>
            <div className="legend-item"><span className="legend-symbol">⛈️</span> Storm</div>
            <div className="legend-item"><span className="legend-symbol">🌾</span> Drought</div>
            <div className="legend-item"><span className="legend-symbol">🌊</span> Tsunami</div>
            <div className="legend-item"><span className="legend-symbol">⛰️</span> Landslide</div>
            <div className="legend-item"><span className="legend-symbol">📍</span> My Location</div>
          </div>
          <div className="legend-radius-note">
            <span className="radius-indicator"></span> Circle = Impact Radius (km &times; 1,000m)
          </div>
        </div>
      )}

      {!showLegend && (
        <button
          onClick={() => setShowLegend(true)}
          className="show-legend-btn"
          title="Show disaster legend"
        >
          Legend
        </button>
      )}
    </div>
  );
};

export default DisasterMap;
