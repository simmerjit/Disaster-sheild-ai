import React, { useState } from 'react';
import { Filter, Search, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

const disasterTypes = [
  { value: 'all', label: 'All Disasters', emoji: '🌐' },
  { value: 'earthquake', label: 'Earthquakes', emoji: '🔴' },
  { value: 'cyclone', label: 'Cyclones', emoji: '🟠' },
  { value: 'flood', label: 'Floods', emoji: '🔵' },
  { value: 'wildfire', label: 'Wildfires', emoji: '🔥' },
  { value: 'volcano', label: 'Volcanoes', emoji: '🟣' },
  { value: 'storm', label: 'Severe Storms', emoji: '⛈️' },
  { value: 'drought', label: 'Droughts', emoji: '🌾' },
  { value: 'tsunami', label: 'Tsunamis', emoji: '🌊' },
  { value: 'landslide', label: 'Landslides', emoji: '⛰️' },
];

const severities = [
  { value: 'all', label: 'All Severities' },
  { value: 'critical', label: 'Critical 🔴' },
  { value: 'high', label: 'High 🟠' },
  { value: 'medium', label: 'Medium 🟡' },
  { value: 'low', label: 'Low 🟢' },
];

const sources = [
  { value: 'all', label: 'All Sources' },
  { value: 'SACHET', label: 'NDMA SACHET (India) 🇮🇳' },
  { value: 'GDACS', label: 'GDACS (Global)' },
  { value: 'USGS', label: 'USGS (Earthquakes)' },
  { value: 'NASA_EONET', label: 'NASA EONET' },
  { value: 'MANUAL', label: 'Database Reports' },
];

const statuses = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active Only' },
  { value: 'resolved', label: 'Resolved' },
];

export const DisasterFilters = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalResults,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Build a compact summary of active filters
  const activeFilterSummary = () => {
    const parts = [];
    if (filters.type !== 'all') {
      const found = disasterTypes.find(t => t.value === filters.type);
      parts.push(found ? `${found.emoji} ${found.label}` : filters.type);
    }
    if (filters.severity !== 'all') {
      parts.push(filters.severity.charAt(0).toUpperCase() + filters.severity.slice(1));
    }
    if (filters.source !== 'all') parts.push(filters.source);
    if (filters.status !== 'all') parts.push(filters.status);
    if (filters.search.trim()) parts.push(`"${filters.search}"`);
    return parts.length > 0 ? parts.join(' · ') : 'All events';
  };

  const hasActiveFilters = filters.type !== 'all' || filters.severity !== 'all' ||
    filters.source !== 'all' || filters.status !== 'all' || filters.search.trim();

  return (
    <div className={`disaster-filters-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Compact Strip — Always Visible */}
      <div className="filters-compact-strip" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="filters-compact-left">
          <Filter size={14} className="filter-strip-icon" />
          <span className="results-count">
            <strong>{totalResults}</strong> events
          </span>
          {hasActiveFilters && (
            <span className="active-filters-summary">{activeFilterSummary()}</span>
          )}
        </div>
        <div className="filters-compact-right">
          {hasActiveFilters && (
            <button
              onClick={(e) => { e.stopPropagation(); onResetFilters(); }}
              className="reset-btn-compact"
              title="Reset all filters"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}
          <button className="filter-toggle-btn" title={isExpanded ? 'Collapse filters' : 'Expand filters'}>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expandable Filter Grid */}
      <div className="filters-expand-body">
        <div className="filters-grid">
          {/* Keyword Search */}
          <div className="filter-group search-group">
            <label htmlFor="search-input">Search Location / Title</label>
            <div className="search-input-wrapper">
              <Search size={15} className="search-icon" />
              <input
                id="search-input"
                type="text"
                placeholder="e.g. Japan, California, Flood..."
                value={filters.search}
                onChange={(e) => onFilterChange('search', e.target.value)}
                className="filter-input"
              />
            </div>
          </div>

          {/* Disaster Type */}
          <div className="filter-group">
            <label htmlFor="type-select">Disaster Type</label>
            <select
              id="type-select"
              value={filters.type}
              onChange={(e) => onFilterChange('type', e.target.value)}
              className="filter-select"
            >
              {disasterTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.emoji} {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div className="filter-group">
            <label htmlFor="severity-select">Severity Level</label>
            <select
              id="severity-select"
              value={filters.severity}
              onChange={(e) => onFilterChange('severity', e.target.value)}
              className="filter-select"
            >
              {severities.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Data Source */}
          <div className="filter-group">
            <label htmlFor="source-select">Data Source</label>
            <select
              id="source-select"
              value={filters.source}
              onChange={(e) => onFilterChange('source', e.target.value)}
              className="filter-select"
            >
              {sources.map((src) => (
                <option key={src.value} value={src.value}>
                  {src.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="filter-group">
            <label htmlFor="status-select">Status</label>
            <select
              id="status-select"
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
              className="filter-select"
            >
              {statuses.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisasterFilters;
