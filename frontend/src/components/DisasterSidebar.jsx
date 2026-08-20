import React, { useState } from 'react';
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Radio,
  CloudSun,
  Navigation,
} from 'lucide-react';
import { calculateDistanceKm, formatDistance } from '../utils/geoUtils';
import SpotlightCard from './SpotlightCard';

const typeIcons = {
  earthquake: '🔴',
  cyclone: '🟠',
  flood: '🔵',
  wildfire: '🔥',
  volcano: '🟣',
  drought: '🌾',
  tsunami: '🌊',
  storm: '⛈️',
  landslide: '⛰️',
  other: '⚠️',
};

export const DisasterSidebar = ({
  disasters = [],
  filteredDisasters = [],
  selectedDisaster,
  onSelectDisaster,
  onRefresh,
  loading,
  lastUpdated,
  userCoords,
  onInspectWeather,
  onInspectNavigation,
  onInspectFacilities,
  onInspectDetails,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'stats'

  // Calculate stats
  const total = disasters.length;
  const criticalCount = disasters.filter((d) => d.severity === 'critical').length;
  const highCount = disasters.filter((d) => d.severity === 'high').length;
  const mediumCount = disasters.filter((d) => d.severity === 'medium').length;
  const lowCount = disasters.filter((d) => d.severity === 'low').length;

  // Counts by disaster type
  const typeCounts = disasters.reduce((acc, d) => {
    const t = d.type || 'other';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const userLat = userCoords ? Number(userCoords.latitude) : null;
  const userLng = userCoords ? Number(userCoords.longitude) : null;

  return (
    <aside className={`disaster-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Collapse Toggle */}
      <button
        className="sidebar-collapse-btn"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {isCollapsed ? (
        <div
          className="sidebar-collapsed-strip"
          onClick={() => setIsCollapsed(false)}
          title="Click to expand live disaster feed"
        >
          <div className="collapsed-indicator">
            <span className="live-pulse-dot"></span>
          </div>
          <div className="collapsed-vertical-text">
            <span>LIVE FEED</span>
            <span className="collapsed-count">({filteredDisasters.length})</span>
          </div>
          {criticalCount > 0 && (
            <div className="collapsed-alert-chip" title={`${criticalCount} Critical Alerts`}>
              <span>{criticalCount}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="sidebar-inner">
          {/* Header */}
          <div className="sidebar-header">
            <div className="live-indicator-wrapper">
              <span className="live-pulse-dot"></span>
              <h2 className="sidebar-title">Global Disaster Feed</h2>
            </div>

            <button
              onClick={onRefresh}
              disabled={loading}
              className="refresh-btn"
              title="Refresh live feeds"
            >
              <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
              <span>{loading ? 'Syncing...' : 'Sync'}</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="metrics-grid">
            <div className="metric-card metric-total">
              <span className="metric-num">{total}</span>
              <span className="metric-label">Total</span>
            </div>
            <div className="metric-card metric-critical">
              <span className="metric-num">{criticalCount}</span>
              <span className="metric-label">Critical</span>
            </div>
            <div className="metric-card metric-high">
              <span className="metric-num">{highCount}</span>
              <span className="metric-label">High</span>
            </div>
            <div className="metric-card metric-med-low">
              <span className="metric-num">{mediumCount + lowCount}</span>
              <span className="metric-label">Med/Low</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="sidebar-tabs">
            <button
              className={`sidebar-tab ${activeTab === 'events' ? 'active' : ''}`}
              onClick={() => setActiveTab('events')}
            >
              Feed ({filteredDisasters.length})
            </button>
            <button
              className={`sidebar-tab ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              Category Stats
            </button>
          </div>

          {/* Tab: Events List */}
          {activeTab === 'events' && (
            <div className="disaster-feed-list">
              {filteredDisasters.length === 0 ? (
                <div className="empty-feed-state">
                  <Radio size={32} className="empty-icon" />
                  <p>No disasters match your current filter selection.</p>
                </div>
              ) : (
                filteredDisasters.map((item) => {
                  const isSel = selectedDisaster?.id === item.id;
                  const emoji = typeIcons[item.type?.toLowerCase()] || '⚠️';

                  // Calculate distance from user if available
                  const itemLat = Number(item.latitude);
                  const itemLng = Number(item.longitude);
                  const dist =
                    userLat && userLng && !isNaN(itemLat) && !isNaN(itemLng)
                      ? calculateDistanceKm(userLat, userLng, itemLat, itemLng)
                      : null;

                  return (
                    <SpotlightCard
                      key={item.id}
                      onClick={() => onSelectDisaster(item)}
                      spotlightColor={
                        item.severity === 'critical'
                          ? 'rgba(239, 68, 68, 0.22)'
                          : item.severity === 'high'
                          ? 'rgba(249, 115, 22, 0.22)'
                          : 'rgba(255, 255, 255, 0.18)'
                      }
                      className={`disaster-card sev-${item.severity || 'medium'} ${
                        isSel ? 'selected' : ''
                      }`}
                    >
                      <div className="disaster-card-header">
                        <span className="card-type-tag">
                          {emoji} {item.type?.toUpperCase()}
                        </span>
                        <div className="header-badges-row">
                          {dist !== null && (
                            <span className="card-dist-badge">
                              📍 {formatDistance(dist)}
                            </span>
                          )}
                          <span className={`card-sev-badge sev-text-${item.severity}`}>
                            {item.severity?.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <h4 className="card-title">{item.title}</h4>

                      <div className="card-meta">
                        <div className="meta-item">
                          <MapPin size={12} />
                          <span>{item.location || item.country || 'Global'}</span>
                        </div>
                        {item.magnitude && (
                          <div className="meta-item mag-highlight">
                            <span>M {item.magnitude}</span>
                          </div>
                        )}
                        <div className="meta-item">
                          <Clock size={12} />
                          <span>
                            {new Date(item.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="card-footer">
                        <div className="card-footer-pills">
                          <span className="card-source-pill">{item.source}</span>
                          <span className="card-radius-pill">~{item.affectedRadius}km radius</span>
                        </div>

                        {/* Quick action buttons */}
                        <div className="card-quick-actions" onClick={(e) => e.stopPropagation()}>
                          {onInspectDetails && (
                            <button
                              onClick={() => {
                                onSelectDisaster(item);
                                onInspectDetails(item);
                              }}
                              className="card-mini-btn details-mini"
                              title="View full incident details & impact"
                            >
                              <span>📑</span>
                            </button>
                          )}
                          {onInspectFacilities && (
                            <button
                              onClick={() => {
                                onSelectDisaster(item);
                                onInspectFacilities({
                                  latitude: itemLat,
                                  longitude: itemLng,
                                  name: item.title,
                                  type: 'disaster',
                                });
                              }}
                              className="card-mini-btn facilities-mini"
                              title="Find nearby emergency facilities (Google Places)"
                            >
                              <span>🏥</span>
                            </button>
                          )}
                          {onInspectWeather && (
                            <button
                              onClick={() => {
                                onSelectDisaster(item);
                                onInspectWeather({
                                  latitude: itemLat,
                                  longitude: itemLng,
                                  name: item.title,
                                  type: item.type,
                                });
                              }}
                              className="card-mini-btn weather-mini"
                              title="Inspect live weather here"
                            >
                              <CloudSun size={12} />
                            </button>
                          )}
                          {onInspectNavigation && (
                            <button
                              onClick={() => {
                                onSelectDisaster(item);
                                onInspectNavigation(item);
                              }}
                              className="card-mini-btn nav-mini"
                              title="Open evacuation routing"
                            >
                              <Navigation size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </SpotlightCard>
                  );
                })
              )}
            </div>
          )}

          {/* Tab: Type Breakdown */}
          {activeTab === 'stats' && (
            <div className="sidebar-breakdown-panel">
              <h3 className="breakdown-subtitle">Disasters by Category</h3>
              <div className="type-pills-list">
                {Object.entries(typeCounts).map(([typeName, count]) => {
                  const emoji = typeIcons[typeName.toLowerCase()] || '⚠️';
                  return (
                    <div key={typeName} className="type-stat-row">
                      <div className="type-stat-info">
                        <span className="type-stat-emoji">{emoji}</span>
                        <span className="type-stat-name">
                          {typeName.charAt(0).toUpperCase() + typeName.slice(1)}
                        </span>
                      </div>
                      <span className="type-stat-count">{count}</span>
                    </div>
                  );
                })}
              </div>

              <div className="severity-summary-box">
                <h3 className="breakdown-subtitle">Severity Overview</h3>
                <div className="sev-bar-container">
                  <div
                    className="sev-bar-segment seg-critical"
                    style={{ width: `${(criticalCount / Math.max(1, total)) * 100}%` }}
                    title={`Critical: ${criticalCount}`}
                  ></div>
                  <div
                    className="sev-bar-segment seg-high"
                    style={{ width: `${(highCount / Math.max(1, total)) * 100}%` }}
                    title={`High: ${highCount}`}
                  ></div>
                  <div
                    className="sev-bar-segment seg-medium"
                    style={{ width: `${(mediumCount / Math.max(1, total)) * 100}%` }}
                    title={`Medium: ${mediumCount}`}
                  ></div>
                  <div
                    className="sev-bar-segment seg-low"
                    style={{ width: `${(lowCount / Math.max(1, total)) * 100}%` }}
                    title={`Low: ${lowCount}`}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Sidebar Footer */}
          {lastUpdated && (
            <div className="sidebar-footer">
              <small>Last synced: {lastUpdated.toLocaleTimeString()}</small>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

export default DisasterSidebar;
