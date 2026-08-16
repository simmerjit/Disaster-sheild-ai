import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchAllDisasters } from '../services/disasterApi';
import DisasterMap from '../components/DisasterMap';
import DisasterSidebar from '../components/DisasterSidebar';
import DisasterFilters from '../components/DisasterFilters';
import { AlertTriangle, RefreshCw, ShieldAlert, Globe2 } from 'lucide-react';

const initialFilters = {
  type: 'all',
  severity: 'all',
  status: 'all',
  source: 'all',
  search: '',
};

export const DisasterMapPage = () => {
  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [filters, setFilters] = useState(initialFilters);
  const [selectedDisaster, setSelectedDisaster] = useState(null);
  const [userCoords, setUserCoords] = useState(null);

  // Load disasters from Express backend
  const loadDisasters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchAllDisasters({ limit: 200 });
      if (response && response.data) {
        setDisasters(response.data);
        setLastUpdated(new Date());
      } else {
        throw new Error('Invalid response structure from backend');
      }
    } catch (err) {
      console.error('Failed to load disaster data:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to reach backend API. Make sure Express server is running on port 5000.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDisasters();
  }, [loadDisasters]);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
    setSelectedDisaster(null);
  };

  // Filter disaster list based on active filters
  const filteredDisasters = useMemo(() => {
    return disasters.filter((item) => {
      // Filter by type
      if (filters.type !== 'all' && item.type?.toLowerCase() !== filters.type.toLowerCase()) {
        return false;
      }

      // Filter by severity
      if (filters.severity !== 'all' && item.severity?.toLowerCase() !== filters.severity.toLowerCase()) {
        return false;
      }

      // Filter by status
      if (filters.status !== 'all' && item.status?.toLowerCase() !== filters.status.toLowerCase()) {
        return false;
      }

      // Filter by source
      if (filters.source !== 'all' && item.source?.toLowerCase() !== filters.source.toLowerCase()) {
        return false;
      }

      // Filter by keyword search (title, country, location)
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const titleMatch = item.title?.toLowerCase().includes(query);
        const locationMatch = item.location?.toLowerCase().includes(query);
        const countryMatch = item.country?.toLowerCase().includes(query);
        const descMatch = item.description?.toLowerCase().includes(query);
        if (!titleMatch && !locationMatch && !countryMatch && !descMatch) {
          return false;
        }
      }

      return true;
    });
  }, [disasters, filters]);

  return (
    <div className="disaster-app-container">
      {/* Top Navbar */}
      <header className="app-header">
        <div className="header-brand">
          <ShieldAlert className="brand-logo" size={28} />
          <div>
            <h1 className="brand-title">CrisisGrid Live</h1>
            <p className="brand-subtitle">Real-time Global Disaster & Emergency Response System</p>
          </div>
        </div>

        <div className="header-status-group">
          <div className="live-status-chip">
            <span className="live-pulse-dot"></span>
            <span>GDACS &bull; USGS &bull; NASA EONET Live Feeds</span>
          </div>
        </div>
      </header>

      {/* Error Notification Banner */}
      {error && (
        <div className="error-banner">
          <div className="error-content">
            <AlertTriangle size={20} className="error-icon" />
            <div>
              <strong>Error Loading Live Disaster Feeds:</strong> {error}
            </div>
          </div>
          <button onClick={loadDisasters} className="retry-btn">
            <RefreshCw size={14} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Filter Control Bar */}
      <DisasterFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalResults={filteredDisasters.length}
      />

      {/* Main Map + Sidebar Work Area */}
      <main className="app-main-layout">
        {/* Disaster Event List & Statistics Sidebar */}
        <DisasterSidebar
          disasters={disasters}
          filteredDisasters={filteredDisasters}
          selectedDisaster={selectedDisaster}
          onSelectDisaster={setSelectedDisaster}
          onRefresh={loadDisasters}
          loading={loading}
          lastUpdated={lastUpdated}
        />

        {/* Leaflet + OpenStreetMap Container */}
        <div className="map-view-pane">
          {loading && (
            <div className="map-loading-overlay">
              <div className="loading-box">
                <Globe2 size={36} className="spin-icon" />
                <p>Fetching real-time disaster feeds from Express backend...</p>
              </div>
            </div>
          )}

          <DisasterMap
            disasters={filteredDisasters}
            selectedDisaster={selectedDisaster}
            onSelectDisaster={setSelectedDisaster}
            userCoords={userCoords}
            onLocationFound={setUserCoords}
          />
        </div>
      </main>
    </div>
  );
};

export default DisasterMapPage;
