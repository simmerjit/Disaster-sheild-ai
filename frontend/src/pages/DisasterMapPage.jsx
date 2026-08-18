import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchAllDisasters } from '../services/disasterApi';
import DisasterMap from '../components/DisasterMap';
import DisasterSidebar from '../components/DisasterSidebar';
import DisasterFilters from '../components/DisasterFilters';
import DisasterDetailsModal from '../components/DisasterDetailsModal';
import DisasterChatbot from '../components/DisasterChatbot';
import RescueLoginModal from '../components/RescueLoginModal';
import {
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  Globe2,
  CloudSun,
  Route,
  Navigation,
  Bot,
  Sparkles,
  Radio,
  LogOut,
  User,
  Shield,
} from 'lucide-react';

const initialFilters = {
  type: 'all',
  severity: 'all',
  status: 'all',
  source: 'all',
  search: '',
};

export const DisasterMapPage = ({ user, rescueTeam, onLogout, onOpenRescueCommand }) => {
  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [filters, setFilters] = useState(initialFilters);
  const [selectedDisaster, setSelectedDisaster] = useState(null);
  const [userCoords, setUserCoords] = useState(null);

  // Weather, Navigation & Nearby Facilities HUD controls
  const [weatherTarget, setWeatherTarget] = useState(null);
  const [showNavTool, setShowNavTool] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [facilitiesOrigin, setFacilitiesOrigin] = useState(null);
  const [showFacilitiesPanel, setShowFacilitiesPanel] = useState(false);

  // AI Chatbot Assistant State
  const [showChatbot, setShowChatbot] = useState(false);

  // Disaster Details Modal state
  const [detailDisaster, setDetailDisaster] = useState(null);

  // Rescue Login Modal state
  const [showRescueLoginModal, setShowRescueLoginModal] = useState(false);

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
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      console.error('Failed to load disasters:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to load live disaster feed from server.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDisasters();
  }, [loadDisasters]);

  // Client-side filtering
  const filteredDisasters = useMemo(() => {
    return disasters.filter((item) => {
      // Type Filter
      if (filters.type !== 'all' && item.type?.toLowerCase() !== filters.type.toLowerCase()) {
        return false;
      }

      // Severity Filter
      if (filters.severity !== 'all' && item.severity?.toLowerCase() !== filters.severity.toLowerCase()) {
        return false;
      }

      // Status Filter
      if (filters.status !== 'all' && item.status?.toLowerCase() !== filters.status.toLowerCase()) {
        return false;
      }

      // Source Filter
      if (filters.source !== 'all' && item.source?.toUpperCase() !== filters.source.toUpperCase()) {
        return false;
      }

      // Text Search
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase();
        const titleMatch = item.title?.toLowerCase().includes(query);
        const locMatch = item.location?.toLowerCase().includes(query);
        const countryMatch = item.country?.toLowerCase().includes(query);
        const descMatch = item.description?.toLowerCase().includes(query);
        if (!titleMatch && !locMatch && !countryMatch && !descMatch) {
          return false;
        }
      }

      return true;
    });
  }, [disasters, filters]);

  // Filter change handlers
  const handleFilterChange = (keyOrObj, value) => {
    if (typeof keyOrObj === 'string') {
      setFilters((prev) => ({ ...prev, [keyOrObj]: value }));
    } else if (keyOrObj && typeof keyOrObj === 'object') {
      setFilters(keyOrObj);
    }
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  // Quick weather inspector helper
  const handleInspectWeather = (target) => {
    setWeatherTarget(target);
  };

  // Quick navigation helper
  const handleInspectNavigation = (disaster) => {
    setSelectedDisaster(disaster);
    setShowNavTool(true);
  };

  return (
    <div className="disaster-app-container">
      {/* Top Application Header */}
      <header className="app-header">
        {/* Left: Brand */}
        <div className="header-brand">
          <div className="brand-icon-wrapper">
            <ShieldAlert size={24} className="brand-logo" />
          </div>
          <div>
            <h1 className="brand-title">DISASTER SHIELD AI</h1>
            <p className="brand-subtitle">
              Live Global Early Warning &amp; Incident Management System
            </p>
          </div>
        </div>

        {/* Center: Nav Buttons */}
        <nav className="header-nav-center">
          {/* Rescue Command Station launcher */}
          <button
            onClick={() => {
              if (onOpenRescueCommand) {
                onOpenRescueCommand();
              } else {
                setShowRescueLoginModal(true);
              }
            }}
            className={`nav-header-btn rescue-portal-btn ${rescueTeam ? 'logged-in' : ''}`}
            title="Open Rescue Team Command Dashboard & Priority Queue"
          >
            <Radio size={15} className="pulse-icon" />
            <span>
              {rescueTeam ? `Rescue Cmd: ${rescueTeam.teamCode || 'Active'}` : 'Rescue Team Command'}
            </span>
            <span className="live-pulse-dot red"></span>
          </button>

          <div className="nav-divider" aria-hidden="true"></div>

          <button
            onClick={() => {
              if (selectedDisaster) {
                setFacilitiesOrigin({
                  latitude: Number(selectedDisaster.latitude),
                  longitude: Number(selectedDisaster.longitude),
                  name: selectedDisaster.title,
                  type: 'disaster',
                });
              } else if (userCoords) {
                setFacilitiesOrigin({
                  latitude: Number(userCoords.latitude),
                  longitude: Number(userCoords.longitude),
                  name: 'Your Location',
                  type: 'user',
                });
              }
              setShowFacilitiesPanel(!showFacilitiesPanel);
            }}
            className={`nav-header-btn ${showFacilitiesPanel ? 'active' : ''}`}
            title="Search Nearby Emergency Facilities (Google Places)"
          >
            <span>🏥</span>
            <span>Emergency Facilities</span>
          </button>

          <button
            onClick={() => {
              if (userCoords) {
                setWeatherTarget({
                  latitude: Number(userCoords.latitude),
                  longitude: Number(userCoords.longitude),
                  name: 'Your Location',
                  type: 'user_location',
                });
              } else if (selectedDisaster) {
                setWeatherTarget({
                  latitude: Number(selectedDisaster.latitude),
                  longitude: Number(selectedDisaster.longitude),
                  name: selectedDisaster.title,
                  type: selectedDisaster.type,
                });
              } else {
                setWeatherTarget({
                  latitude: 20.5937,
                  longitude: 78.9629,
                  name: 'India / Regional Center',
                  type: 'region_center',
                });
              }
            }}
            className={`nav-header-btn ${weatherTarget ? 'active' : ''}`}
            title="Open Live Weather Tool"
          >
            <CloudSun size={15} />
            <span>Live Weather</span>
          </button>

          <button
            onClick={() => setShowNavTool(!showNavTool)}
            className={`nav-header-btn ${showNavTool ? 'active' : ''}`}
            title="Open Evacuation &amp; Navigation Tool"
          >
            <Route size={15} />
            <span>Evacuation Tool</span>
          </button>

          <button
            onClick={() => setShowChatbot(!showChatbot)}
            className={`nav-header-btn ai-assistant-header-btn ${showChatbot ? 'active' : ''}`}
            title="Open DisasterShield AI Emergency Assistant"
          >
            <Bot size={15} className="ai-btn-icon" />
            <span>AI Assistant</span>
            <span className="ai-sparkle-dot"></span>
          </button>
        </nav>

        {/* Right: User Profile HUD & Sign Out */}
        <div className="header-right-group">
          {user && (
            <div className="user-profile-hud-chip">
              <div className="user-avatar-circle">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} />
                ) : (
                  <span>{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                )}
              </div>
              <div className="user-info-meta">
                <span className="user-name-text">{user.name}</span>
                <span className={`user-role-tag ${user.role || 'citizen'}`}>
                  {user.role === 'rescue_worker' ? '🛡️ Rescuer' : user.role === 'coordinator' ? '🏛️ Coordinator' : '👤 Citizen'}
                </span>
              </div>
            </div>
          )}

          {onLogout && (
            <button onClick={onLogout} className="header-logout-btn" title="Sign Out of Session">
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          )}
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
          userCoords={userCoords}
          onInspectWeather={handleInspectWeather}
          onInspectNavigation={handleInspectNavigation}
          onInspectFacilities={(origin) => {
            setFacilitiesOrigin(origin);
            setShowFacilitiesPanel(true);
          }}
          onInspectDetails={(item) => {
            setDetailDisaster(item);
          }}
        />

        {/* Google Maps Container */}
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
            weatherTarget={weatherTarget}
            onSetWeatherTarget={setWeatherTarget}
            showNavTool={showNavTool}
            onToggleNavTool={setShowNavTool}
            facilities={facilities}
            onFacilitiesLoaded={setFacilities}
            facilitiesOrigin={facilitiesOrigin}
            onSetFacilitiesOrigin={setFacilitiesOrigin}
            showFacilitiesPanel={showFacilitiesPanel}
            onToggleFacilitiesPanel={setShowFacilitiesPanel}
            onOpenDetails={(item) => {
              setDetailDisaster(item);
            }}
          />
        </div>
      </main>

      {/* Dedicated Full Disaster Incident Details Modal */}
      {detailDisaster && (
        <DisasterDetailsModal
          disaster={detailDisaster}
          onClose={() => setDetailDisaster(null)}
          userCoords={userCoords}
          onOpenFacilities={(origin) => {
            setFacilitiesOrigin(origin);
            setShowFacilitiesPanel(true);
          }}
          onOpenWeather={(target) => {
            setWeatherTarget(target);
          }}
        />
      )}

      {/* Rescue Team Quick Switch Modal */}
      <RescueLoginModal
        isOpen={showRescueLoginModal}
        onClose={() => setShowRescueLoginModal(false)}
        onLoginSuccess={() => {
          if (onOpenRescueCommand) onOpenRescueCommand();
        }}
      />

      {/* Floating AI Assistant Trigger Button */}
      <button
        onClick={() => setShowChatbot(!showChatbot)}
        className={`floating-ai-launcher-btn ${showChatbot ? 'active' : ''}`}
        title="Open DisasterShield AI Emergency Assistant"
      >
        <div className="floating-launcher-inner gemini-gradient">
          <Sparkles size={18} className="floating-bot-icon" />
        </div>
        <span className="floating-btn-text">DisasterShield AI</span>
      </button>

      {/* DisasterShield AI Chatbot Assistant Modal */}
      <DisasterChatbot
        isOpen={showChatbot}
        onClose={() => setShowChatbot(false)}
        userCoords={userCoords}
        selectedDisaster={selectedDisaster}
        onOpenFacilities={(origin, facilityType) => {
          if (origin) setFacilitiesOrigin(origin);
          setShowFacilitiesPanel(true);
        }}
        onOpenWeather={(target) => {
          setWeatherTarget(target);
        }}
        onOpenNavigation={() => {
          setShowNavTool(true);
        }}
        onFilterDisasterType={(type) => {
          setFilters((prev) => ({ ...prev, type }));
        }}
      />
    </div>
  );
};

export default DisasterMapPage;
