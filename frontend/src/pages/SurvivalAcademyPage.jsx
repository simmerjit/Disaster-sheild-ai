import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Search,
  Flame,
  Sparkles,
  Award,
  ShieldCheck,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Filter,
  ArrowLeft,
  RefreshCw,
  Plus,
  Compass,
  AlertTriangle,
  BookOpen,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  LifeBuoy,
  X,
  TrendingUp,
} from 'lucide-react';
import SurvivalCard from '../components/survival/SurvivalCard';
import SurvivalVideoModal from '../components/survival/SurvivalVideoModal';
import UploadSurvivalModal from '../components/survival/UploadSurvivalModal';
import {
  fetchSurvivalContent,
  fetchTrendingSurvival,
  fetchFeaturedSurvival,
  fetchDisasterRecommendations,
  fetchEmergencyQuickGuides,
  fetchSurvivalCategories,
} from '../services/survivalApi';

const DISASTER_FILTER_BUTTONS = [
  { id: 'all', label: 'All Disasters', emoji: '🌐' },
  { id: 'earthquake', label: 'Earthquake', emoji: '🌋' },
  { id: 'flood', label: 'Flood', emoji: '🌊' },
  { id: 'cyclone', label: 'Cyclone / Storm', emoji: '🌀' },
  { id: 'wildfire', label: 'Wildfire', emoji: '🔥' },
  { id: 'tsunami', label: 'Tsunami', emoji: '🌊' },
  { id: 'emergency_first_aid', label: 'First Aid & CPR', emoji: '🩹' },
  { id: 'water_purification', label: 'Water Sanitation', emoji: '💧' },
  { id: 'survival_skills', label: 'Survival Skills', emoji: '🏕️' },
  { id: 'general', label: 'Emergency Kits', emoji: '🎒' },
];

export const SurvivalAcademyPage = ({
  user,
  initialDisasterType = null,
  onBackToMap,
}) => {
  // Determine initial disaster from URL query or prop
  const urlParams = new URLSearchParams(window.location.search);
  const urlDisaster = urlParams.get('disaster') || initialDisasterType || 'all';

  const [selectedDisasterType, setSelectedDisasterType] = useState(urlDisaster);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('trending'); // 'trending' | 'recent' | 'views' | 'likes'
  const [page, setPage] = useState(1);

  // Content state
  const [lessons, setLessons] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 12 });
  const [trendingLessons, setTrendingLessons] = useState([]);
  const [featuredLessons, setFeaturedLessons] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [quickGuides, setQuickGuides] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [activeVideoModal, setActiveVideoModal] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBookmarksDrawer, setShowBookmarksDrawer] = useState(false);
  const [expandedGuideId, setExpandedGuideId] = useState(null);

  // LocalStorage Bookmarks & Completed Lessons
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem('ds_survival_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [completedIds, setCompletedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('ds_survival_completed');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync Bookmarks to LocalStorage
  const handleToggleBookmark = useCallback((item) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b._id === item._id);
      let updated;
      if (exists) {
        updated = prev.filter((b) => b._id !== item._id);
      } else {
        updated = [item, ...prev];
      }
      try {
        localStorage.setItem('ds_survival_bookmarks', JSON.stringify(updated));
      } catch (e) {
        console.warn('Storage error:', e);
      }
      return updated;
    });
  }, []);

  // Sync Completed to LocalStorage
  const handleToggleCompleted = useCallback((id) => {
    setCompletedIds((prev) => {
      const exists = prev.includes(id);
      let updated;
      if (exists) {
        updated = prev.filter((item) => item !== id);
      } else {
        updated = [...prev, id];
      }
      try {
        localStorage.setItem('ds_survival_completed', JSON.stringify(updated));
      } catch (e) {
        console.warn('Storage error:', e);
      }
      return updated;
    });
  }, []);

  // Load Main Content
  const loadLessons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSurvivalContent({
        page,
        limit: 12,
        disasterType: selectedDisasterType !== 'all' ? selectedDisasterType : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
        search: searchQuery.trim() || undefined,
        sortBy,
      });

      if (res && res.data) {
        setLessons(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to load survival lessons:', err);
    } finally {
      setLoading(false);
    }
  }, [page, selectedDisasterType, selectedCategory, selectedDifficulty, searchQuery, sortBy]);

  // Load Initial Recommendations, Trending, Categories & Quick Guides
  const loadInitialHighlights = useCallback(async () => {
    try {
      const [trendRes, featRes, catRes, guideRes] = await Promise.allSettled([
        fetchTrendingSurvival(6),
        fetchFeaturedSurvival(4),
        fetchSurvivalCategories(),
        fetchEmergencyQuickGuides(),
      ]);

      if (trendRes.status === 'fulfilled' && trendRes.value?.data) {
        setTrendingLessons(trendRes.value.data);
      }
      if (featRes.status === 'fulfilled' && featRes.value?.data) {
        setFeaturedLessons(featRes.value.data);
      }
      if (catRes.status === 'fulfilled' && catRes.value?.data) {
        setCategories(catRes.value.data);
      }
      if (guideRes.status === 'fulfilled' && guideRes.value?.data) {
        setQuickGuides(guideRes.value.data);
      }
    } catch (e) {
      console.warn('Highlights load error:', e);
    }
  }, []);

  // Load Disaster-Specific Recommendations
  const loadDisasterRecs = useCallback(async (type) => {
    if (!type || type === 'all') {
      setRecommendations(null);
      return;
    }
    try {
      const res = await fetchDisasterRecommendations(type);
      if (res && res.data) {
        setRecommendations(res.data);
      }
    } catch (e) {
      console.warn('Recommendations load error:', e);
    }
  }, []);

  useEffect(() => {
    loadInitialHighlights();
  }, [loadInitialHighlights]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  useEffect(() => {
    if (selectedDisasterType !== 'all') {
      loadDisasterRecs(selectedDisasterType);
    } else {
      setRecommendations(null);
    }
  }, [selectedDisasterType, loadDisasterRecs]);

  return (
    <div className="survival-academy-page">
      {/* ── 1. Top Navbar Header ────────────────────────────────────────────── */}
      <header className="survival-navbar">
        <div className="navbar-brand-left">
          <div className="brand-logo-academy">
            <GraduationCap size={22} className="academy-cap-icon" />
          </div>
          <div>
            <h1 className="academy-brand-title">Disaster Survival Academy</h1>
            <span className="academy-brand-sub">Verified Emergency Response &amp; Preparedness Training</span>
          </div>
        </div>

        <div className="navbar-actions-right">
          {/* Back to Map button */}
          <button
            onClick={() => {
              if (onBackToMap) onBackToMap();
              else window.location.href = '/';
            }}
            className="btn-nav-action map-back"
            title="Return to Real-Time Disaster Map"
          >
            <ArrowLeft size={16} />
            <span>Tactical Map</span>
          </button>

          {/* Bookmarks Toggle */}
          <button
            onClick={() => setShowBookmarksDrawer(true)}
            className="btn-nav-action bookmarks"
            title="View saved survival lessons"
          >
            <Bookmark size={15} />
            <span>Saved ({bookmarks.length})</span>
          </button>

          {/* Completed badge counter */}
          <div className="completed-counter-pill" title="Lessons marked completed">
            <CheckCircle2 size={14} className="text-emerald" />
            <span>{completedIds.length} Completed</span>
          </div>

          {/* Publish / Upload button */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-nav-action upload"
            title="Publish new survival lesson"
          >
            <Plus size={15} />
            <span>Contribute</span>
          </button>
        </div>
      </header>

      {/* ── 2. Hero Section ─────────────────────────────────────────────────── */}
      <section className="survival-hero-section">
        <div className="hero-content-center">
          <div className="hero-badge-pill">
            <ShieldCheck size={14} className="text-emerald" />
            <span>CERTIFIED DISASTER DEFENSE &amp; LIFE-SAVING LESSONS</span>
          </div>
          <h2 className="hero-main-title">
            Learn How To Survive <span className="highlight-text">Any Crisis</span>
          </h2>
          <p className="hero-subtext">
            Trusted educational videos, emergency quick action protocols, trauma first aid tutorials, and comprehensive preparedness guides from disaster response authorities worldwide.
          </p>

          {/* Search Box */}
          <div className="hero-search-wrapper">
            <Search size={18} className="search-bar-icon" />
            <input
              type="text"
              placeholder="Search survival lessons (e.g., Drop Cover Hold, Tourniquet, Water Purification, Wildfire Smoke)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="hero-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="btn-clear-search"
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── 3. Active Disaster Emergency Alert Protocol Banner ─────────────── */}
      {selectedDisasterType !== 'all' && recommendations && (
        <section className="emergency-disaster-protocol-banner">
          <div className="protocol-banner-header">
            <div className="protocol-title-row">
              <div className="alert-pulse-circle">
                <AlertTriangle size={20} className="text-amber-400" />
              </div>
              <div>
                <h3 className="protocol-banner-heading">
                  EMERGENCY SURVIVAL PROTOCOL:{' '}
                  <span className="disaster-name-highlight">
                    {selectedDisasterType.replace('_', ' ').toUpperCase()}
                  </span>
                </h3>
                <p className="protocol-banner-sub">
                  Recommended action steps and certified training for current crisis sector.
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedDisasterType('all')}
              className="btn-reset-disaster-filter"
            >
              View All Disasters
            </button>
          </div>

          {/* 4-Step Quick Action Protocol Bar */}
          {recommendations.emergencyQuickGuide?.steps && (
            <div className="protocol-steps-grid">
              {recommendations.emergencyQuickGuide.steps.slice(0, 4).map((step, idx) => (
                <div key={idx} className="protocol-step-card">
                  <div className="step-badge-num">{idx + 1}</div>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          )}

          {/* Recommended Videos Carousel / Grid for this disaster */}
          {recommendations.primaryVideos?.length > 0 && (
            <div className="protocol-videos-section">
              <h4 className="protocol-section-title">
                <Sparkles size={15} className="text-amber-400" /> Essential Survival Lessons for{' '}
                {selectedDisasterType.toUpperCase()}
              </h4>
              <div className="protocol-videos-grid">
                {recommendations.primaryVideos.map((item) => (
                  <SurvivalCard
                    key={item._id}
                    item={item}
                    onOpenVideo={setActiveVideoModal}
                    isBookmarked={bookmarks.some((b) => b._id === item._id)}
                    onToggleBookmark={handleToggleBookmark}
                    isCompleted={completedIds.includes(item._id)}
                    onToggleCompleted={handleToggleCompleted}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── 4. Disaster Filter Buttons Bar ──────────────────────────────────── */}
      <section className="disaster-filter-pills-section">
        <div className="filter-pills-scroll-container">
          {DISASTER_FILTER_BUTTONS.map((btn) => (
            <button
              key={btn.id}
              onClick={() => {
                setSelectedDisasterType(btn.id);
                setPage(1);
              }}
              className={`disaster-pill-tab ${selectedDisasterType === btn.id ? 'active' : ''}`}
            >
              <span className="pill-emoji">{btn.emoji}</span>
              <span>{btn.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── 5. Main Content Area & Tabs Grid ────────────────────────────────── */}
      <main className="survival-content-container">
        {/* Controls Toolbar: Categories, Difficulty & Sorting */}
        <div className="content-controls-toolbar">
          <div className="toolbar-left-filters">
            {/* Category Dropdown */}
            <div className="custom-select-wrapper">
              <label>Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Categories</option>
                <option value="Emergency Response">Emergency Response</option>
                <option value="Medical First Aid">Medical First Aid</option>
                <option value="Disaster Preparedness">Disaster Preparedness</option>
                <option value="Water Purification">Water Purification</option>
                <option value="Shelter Building">Shelter Building</option>
                <option value="Search and Rescue">Search and Rescue</option>
                <option value="Emergency Kits">Emergency Kits</option>
                <option value="Basic Survival">Basic Survival</option>
              </select>
            </div>

            {/* Difficulty Dropdown */}
            <div className="custom-select-wrapper">
              <label>Difficulty:</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => {
                  setSelectedDifficulty(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Levels</option>
                <option value="Beginner">Beginner (Family Safe)</option>
                <option value="Intermediate">Intermediate (Community)</option>
                <option value="Advanced">Advanced (First Responder)</option>
              </select>
            </div>
          </div>

          <div className="toolbar-right-sort">
            <div className="custom-select-wrapper">
              <label>Sort By:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="trending">🔥 Trending First</option>
                <option value="views">👁️ Most Viewed</option>
                <option value="likes">❤️ Most Liked</option>
                <option value="recent">⏱️ Recently Added</option>
                <option value="title">🔤 Alphabetical</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── 6. Lessons Cards Grid ─────────────────────────────────────────── */}
        {loading ? (
          <div className="lessons-skeleton-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="lesson-skeleton-card">
                <div className="skeleton-thumb"></div>
                <div className="skeleton-title"></div>
                <div className="skeleton-desc"></div>
              </div>
            ))}
          </div>
        ) : lessons.length === 0 ? (
          <div className="lessons-empty-state">
            <GraduationCap size={44} className="text-muted" />
            <h3>No survival lessons match your filters</h3>
            <p>Try resetting search keywords or choosing a different disaster type.</p>
            <button
              onClick={() => {
                setSelectedDisasterType('all');
                setSelectedCategory('all');
                setSelectedDifficulty('all');
                setSearchQuery('');
              }}
              className="btn-reset-filters"
            >
              <RefreshCw size={14} /> Reset All Filters
            </button>
          </div>
        ) : (
          <>
            <div className="lessons-cards-grid">
              <AnimatePresence>
                {lessons.map((item) => (
                  <SurvivalCard
                    key={item._id}
                    item={item}
                    onOpenVideo={setActiveVideoModal}
                    isBookmarked={bookmarks.some((b) => b._id === item._id)}
                    onToggleBookmark={handleToggleBookmark}
                    isCompleted={completedIds.includes(item._id)}
                    onToggleCompleted={handleToggleCompleted}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="pagination-bar">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="btn-page-nav"
                >
                  Previous
                </button>
                <span className="page-indicator">
                  Page {page} of {pagination.totalPages} ({pagination.total} lessons)
                </span>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="btn-page-nav"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* ── 7. Emergency Quick Guides & Checklists Accordion Section ──────── */}
        <section className="emergency-quick-guides-section">
          <div className="quick-guides-header">
            <div>
              <h3 className="section-title">
                <BookOpen size={20} className="text-emerald" /> Emergency Quick Guides &amp; Action Checklists
              </h3>
              <p className="section-sub">
                Instant step-by-step memory aids and print-ready checklists for immediate crisis response.
              </p>
            </div>
          </div>

          <div className="quick-guides-accordion-list">
            {quickGuides.map((guide) => {
              const isExpanded = expandedGuideId === guide.id;
              const qg = guide.quickGuide || {};
              return (
                <div key={guide.id} className={`guide-accordion-card ${isExpanded ? 'expanded' : ''}`}>
                  <div
                    className="guide-accordion-header"
                    onClick={() => setExpandedGuideId(isExpanded ? null : guide.id)}
                  >
                    <div className="accordion-title-box">
                      <span className="badge-disaster-pill">
                        {guide.disasterType?.toUpperCase()}
                      </span>
                      <h4>{guide.title}</h4>
                    </div>
                    <ChevronDown size={18} className={`chevron-icon ${isExpanded ? 'rotate' : ''}`} />
                  </div>

                  {isExpanded && (
                    <div className="guide-accordion-body">
                      {/* Steps */}
                      {qg.steps?.length > 0 && (
                        <div className="guide-step-group">
                          <h5>Action Steps:</h5>
                          <ol className="guide-steps-list">
                            {qg.steps.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* DOs and DONTs */}
                      <div className="guide-dos-donts-grid">
                        {qg.dos?.length > 0 && (
                          <div className="dos-box">
                            <h6>DO:</h6>
                            <ul>
                              {qg.dos.map((d, idx) => (
                                <li key={idx}>✓ {d}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {qg.donts?.length > 0 && (
                          <div className="donts-box">
                            <h6>DON'T:</h6>
                            <ul>
                              {qg.donts.map((d, idx) => (
                                <li key={idx}>✕ {d}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Checklist */}
                      {qg.emergencyChecklist?.length > 0 && (
                        <div className="guide-checklist-group">
                          <h5>Emergency Gear Checklist:</h5>
                          <div className="checklist-chips">
                            {qg.emergencyChecklist.map((c, idx) => (
                              <span key={idx} className="checklist-chip">
                                🎒 {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* ── 8. Saved Bookmarks Drawer ────────────────────────────────────────── */}
      {showBookmarksDrawer && (
        <div className="bookmarks-drawer-backdrop" onClick={() => setShowBookmarksDrawer(false)}>
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25 }}
            className="bookmarks-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bookmarks-drawer-header">
              <div className="drawer-title-box">
                <BookmarkCheck size={20} className="text-emerald" />
                <h3>Saved Survival Lessons ({bookmarks.length})</h3>
              </div>
              <button onClick={() => setShowBookmarksDrawer(false)} className="btn-close-drawer">
                <X size={18} />
              </button>
            </div>

            <div className="bookmarks-drawer-content">
              {bookmarks.length === 0 ? (
                <div className="bookmarks-empty">
                  <Bookmark size={36} className="text-muted" />
                  <p>No saved survival lessons yet.</p>
                  <span>Click the bookmark icon on any lesson to save it for offline preparation.</span>
                </div>
              ) : (
                <div className="bookmarks-cards-stack">
                  {bookmarks.map((item) => (
                    <div
                      key={item._id}
                      className="bookmark-item-row"
                      onClick={() => {
                        setActiveVideoModal(item);
                        setShowBookmarksDrawer(false);
                      }}
                    >
                      <img
                        src={item.thumbnail || `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`}
                        alt={item.title}
                        className="bookmark-thumb"
                      />
                      <div className="bookmark-details">
                        <span className="badge-disaster-mini">{item.disasterType?.toUpperCase()}</span>
                        <h4 className="bookmark-title">{item.title}</h4>
                        <span className="bookmark-meta">{item.duration} • {item.difficulty}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleBookmark(item);
                        }}
                        className="btn-remove-bookmark"
                        title="Remove bookmark"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* ── 9. Video Modal Player ───────────────────────────────────────────── */}
      {activeVideoModal && (
        <SurvivalVideoModal
          item={activeVideoModal}
          onClose={() => setActiveVideoModal(null)}
          isBookmarked={bookmarks.some((b) => b._id === activeVideoModal._id)}
          onToggleBookmark={handleToggleBookmark}
          isCompleted={completedIds.includes(activeVideoModal._id)}
          onToggleCompleted={handleToggleCompleted}
        />
      )}

      {/* ── 10. Upload Modal ───────────────────────────────────────────────── */}
      {showUploadModal && (
        <UploadSurvivalModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={(newDoc) => {
            loadLessons();
            loadInitialHighlights();
          }}
        />
      )}
    </div>
  );
};

export default SurvivalAcademyPage;
