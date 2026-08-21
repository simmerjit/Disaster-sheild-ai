import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  RefreshCw,
  X,
  Search,
  Filter,
  Sparkles,
  Users,
  Utensils,
  HeartPulse,
  Droplets,
  Zap,
  Navigation,
  MapPin,
  ShieldCheck,
  Award,
  ChevronRight,
  RotateCcw,
  SlidersHorizontal,
  Building2,
} from 'lucide-react';
import { formatDistance, calculateDistanceKm } from '../utils/geoUtils';

const FILTER_TABS = [
  { id: 'all', label: 'All Shelters', icon: null },
  { id: 'recommended', label: 'Recommended', emoji: '⭐' },
  { id: 'medical', label: 'Medical Triage', emoji: '🩹' },
  { id: 'food', label: 'Food Available', emoji: '🍲' },
  { id: 'water', label: 'Water Supply', emoji: '💧' },
  { id: 'power', label: 'Power Backup', emoji: '⚡' },
  { id: 'high_cap', label: 'High Capacity (>500)', emoji: '🏢' },
  { id: 'near_10', label: '< 10 km', emoji: '📍' },
  { id: 'near_25', label: '< 25 km', emoji: '📍' },
];

export const ShelterSidebar = ({
  shelters = [],
  recommendedShelter,
  selectedShelter,
  onSelectShelter,
  onNavigate,
  onOpenDetails,
  stats,
  loading,
  onRefresh,
  userCoords,
  onClose,
}) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const userLat = userCoords ? Number(userCoords.latitude) : null;
  const userLng = userCoords ? Number(userCoords.longitude) : null;

  // Filter and sort shelters according to strict priority
  const sortedAndFilteredShelters = useMemo(() => {
    // 1. Filter
    const list = shelters.filter((item) => {
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = item.name?.toLowerCase().includes(query);
        const addrMatch = item.address?.toLowerCase().includes(query);
        const typeMatch = item.type?.toLowerCase().includes(query);
        if (!nameMatch && !addrMatch && !typeMatch) return false;
      }

      // Smart filter tabs
      if (activeFilter === 'recommended') {
        const isRec =
          item.recommended ||
          (recommendedShelter &&
            (recommendedShelter._id === item._id ||
              (recommendedShelter.name === item.name &&
                Math.abs(recommendedShelter.latitude - item.latitude) < 0.001)));
        if (!isRec) return false;
      }

      if (activeFilter === 'food' && !item.facilities?.foodAvailable) return false;
      if (activeFilter === 'medical' && !item.facilities?.medicalAvailable) return false;
      if (activeFilter === 'water' && !item.facilities?.waterAvailable) return false;
      if (activeFilter === 'power' && !item.facilities?.powerAvailable) return false;

      if (activeFilter === 'high_cap') {
        const total = item.capacity?.totalBeds || 0;
        if (total < 500) return false;
      }

      if (activeFilter === 'near_10' || activeFilter === 'near_25') {
        const threshold = activeFilter === 'near_10' ? 10 : 25;
        const lat = Number(item.latitude);
        const lng = Number(item.longitude);
        if (userLat !== null && userLng !== null && !isNaN(lat) && !isNaN(lng)) {
          const dist = calculateDistanceKm(userLat, userLng, lat, lng);
          if (dist > threshold) return false;
        } else if (item.distanceKm != null && item.distanceKm > threshold) {
          return false;
        }
      }

      return true;
    });

    // 2. Multi-factor Sorting Priority:
    // Priority 1: Distance
    // Priority 2: Available Beds (descending)
    // Priority 3: Medical Facilities (available first)
    // Priority 4: Shelter Total Capacity (descending)
    return list.sort((a, b) => {
      // 1. Distance
      const distA = a.distanceKm != null ? a.distanceKm : 9999;
      const distB = b.distanceKm != null ? b.distanceKm : 9999;
      if (Math.abs(distA - distB) > 2) {
        return distA - distB;
      }

      // 2. Available Beds
      const bedsA = a.capacity?.availableBeds || 0;
      const bedsB = b.capacity?.availableBeds || 0;
      if (bedsB !== bedsA) {
        return bedsB - bedsA;
      }

      // 3. Medical Facilities
      const medA = a.facilities?.medicalAvailable ? 1 : 0;
      const medB = b.facilities?.medicalAvailable ? 1 : 0;
      if (medB !== medA) {
        return medB - medA;
      }

      // 4. Total Capacity
      const capA = a.capacity?.totalBeds || 0;
      const capB = b.capacity?.totalBeds || 0;
      return capB - capA;
    });
  }, [shelters, activeFilter, searchQuery, recommendedShelter, userLat, userLng]);

  return (
    <aside className="shelter-sidebar-panel">
      {/* 1. Header */}
      <div className="shelter-sidebar-header">
        <div className="sidebar-brand-title">
          <div className="brand-badge-icon">
            <span>🏕️</span>
          </div>
          <div>
            <h3>Emergency Shelter Registry</h3>
            <span className="sidebar-sub-badge">Live Intake &amp; Evacuation Hubs</span>
          </div>
        </div>

        <div className="sidebar-header-actions">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="sidebar-action-icon-btn"
            title="Refresh shelter feeds"
          >
            <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
          </button>
          {onClose && (
            <button onClick={onClose} className="sidebar-action-icon-btn close" title="Close shelter sidebar">
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Dashboard Statistics Summary Bar */}
      {stats && (
        <div className="shelter-dashboard-stats-strip">
          <div className="stats-metric-card">
            <span className="stats-num">{shelters.length || stats.totalShelters || 0}</span>
            <span className="stats-label">Shelters</span>
          </div>
          <div className="stats-metric-card highlight-green">
            <span className="stats-num text-emerald">
              {(stats.availableBeds || 0).toLocaleString()}
            </span>
            <span className="stats-label">Available Beds</span>
          </div>
          <div className="stats-metric-card">
            <span className="stats-num">
              {(stats.totalCapacity || 0).toLocaleString()}
            </span>
            <span className="stats-label">Total Beds</span>
          </div>
          <div className="stats-metric-card">
            <span className="stats-num text-pink">{stats.medicalShelters || 0}</span>
            <span className="stats-label">Medical Triage</span>
          </div>
        </div>
      )}

      {/* 3. Search & Filter Bar */}
      <div className="shelter-search-section">
        <div className="shelter-search-input-wrapper">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Search shelters by name, area, type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="shelter-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="clear-search-btn"
              title="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filter Tabs Horizontal Scroll */}
        <div className="shelter-filter-tabs-scroll">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`filter-pill-tab ${activeFilter === tab.id ? 'active' : ''}`}
            >
              {tab.emoji && <span className="tab-emoji">{tab.emoji}</span>}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Shelter Cards Feed */}
      <div className="shelter-feed-scrollable">
        {loading ? (
          <div className="shelter-loading-skeleton-container">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="shelter-card-skeleton">
                <div className="skeleton-title"></div>
                <div className="skeleton-sub"></div>
                <div className="skeleton-bar"></div>
                <div className="skeleton-tags"></div>
              </div>
            ))}
          </div>
        ) : sortedAndFilteredShelters.length === 0 ? (
          <div className="shelter-empty-state">
            <Building2 size={36} className="empty-icon text-muted" />
            <h4>No matching emergency shelters</h4>
            <p>Try resetting filters or panning to another disaster region.</p>
            <button
              onClick={() => {
                setActiveFilter('all');
                setSearchQuery('');
              }}
              className="btn-reset-filters"
            >
              <RotateCcw size={13} />
              <span>Reset Filters</span>
            </button>
          </div>
        ) : (
          <div className="shelter-cards-list">
            <AnimatePresence>
              {sortedAndFilteredShelters.map((shelter, index) => {
                const isRec =
                  shelter.recommended ||
                  (recommendedShelter &&
                    (recommendedShelter._id === shelter._id ||
                      (recommendedShelter.name === shelter.name &&
                        Math.abs(recommendedShelter.latitude - shelter.latitude) < 0.001)));

                const isSelected = selectedShelter && selectedShelter._id === shelter._id;

                const totalBeds = shelter.capacity?.totalBeds || 0;
                const availableBeds = shelter.capacity?.availableBeds || 0;
                const occPercent =
                  totalBeds > 0
                    ? Math.min(100, Math.round(((totalBeds - availableBeds) / totalBeds) * 100))
                    : 0;

                const statusColorClass =
                  occPercent >= 90
                    ? 'progress-danger'
                    : occPercent >= 70
                    ? 'progress-warning'
                    : 'progress-success';

                return (
                  <motion.div
                    key={shelter._id || `shelter-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                    className={`shelter-item-card ${isRec ? 'is-recommended' : ''} ${
                      isSelected ? 'is-selected' : ''
                    }`}
                    onClick={() => onSelectShelter && onSelectShelter(shelter)}
                  >
                    {/* Top Badges Row */}
                    <div className="shelter-card-top-row">
                      {isRec ? (
                        <span className="badge-recommended">
                          <Award size={12} />
                          <span>AI Recommended Choice</span>
                        </span>
                      ) : (
                        <span className="badge-shelter-source">
                          {shelter.source === 'overpass' ? 'Verified Facility' : 'Emergency Camp'}
                        </span>
                      )}

                      {shelter.distanceKm != null && (
                        <span className="shelter-dist-pill">
                          <MapPin size={11} />
                          {shelter.distanceKm} km away
                        </span>
                      )}
                    </div>

                    {/* Shelter Name & Address */}
                    <h4 className="shelter-card-title">{shelter.name}</h4>
                    <p className="shelter-card-address">{shelter.address}</p>

                    {/* Capacity Progress Meter */}
                    <div className="shelter-capacity-meter-box">
                      <div className="capacity-label-row">
                        <span className="cap-label">
                          <Users size={12} /> Occupancy
                        </span>
                        <span className="cap-values">
                          <strong>{availableBeds}</strong> free / {totalBeds} beds ({occPercent}%)
                        </span>
                      </div>
                      <div className="capacity-progress-track">
                        <div
                          className={`capacity-progress-fill ${statusColorClass}`}
                          style={{ width: `${occPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Facility Amenities Chips */}
                    <div className="shelter-facility-chips-row">
                      {shelter.facilities?.foodAvailable && (
                        <span className="facility-chip active" title="Hot food & nutrition packs">
                          <Utensils size={11} /> Food
                        </span>
                      )}
                      {shelter.facilities?.medicalAvailable && (
                        <span className="facility-chip active medical" title="Medical staff & triage">
                          <HeartPulse size={11} /> Medical
                        </span>
                      )}
                      {shelter.facilities?.waterAvailable && (
                        <span className="facility-chip active" title="Safe drinking water">
                          <Droplets size={11} /> Water
                        </span>
                      )}
                      {shelter.facilities?.powerAvailable && (
                        <span className="facility-chip active" title="Generator / Backup power">
                          <Zap size={11} /> Power
                        </span>
                      )}
                    </div>

                    {/* Card Action Buttons */}
                    <div className="shelter-card-actions-row">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onNavigate) onNavigate(shelter);
                        }}
                        className="btn-shelter-action navigate"
                        title="Calculate driving evacuation route on map"
                      >
                        <Navigation size={12} />
                        <span>Safe Route</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenDetails) onOpenDetails(shelter);
                        }}
                        className="btn-shelter-action details"
                        title="View complete intake metrics & contact details"
                      >
                        <span>Details</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </aside>
  );
};

export default ShelterSidebar;
