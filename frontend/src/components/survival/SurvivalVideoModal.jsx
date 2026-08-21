import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Heart,
  Bookmark,
  BookmarkCheck,
  CheckSquare,
  Square,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Share2,
  ExternalLink,
  BookOpen,
  Clock,
  Eye,
  Award,
  ListOrdered,
} from 'lucide-react';
import { likeSurvivalContent } from '../../services/survivalApi';

export const SurvivalVideoModal = ({
  item,
  onClose,
  isBookmarked,
  onToggleBookmark,
  isCompleted,
  onToggleCompleted,
}) => {
  if (!item) return null;

  const [activeTab, setActiveTab] = useState('steps'); // 'steps' | 'dos_donts' | 'checklist' | 'overview'
  const [likesCount, setLikesCount] = useState(item.likes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [checkedList, setCheckedList] = useState({});
  const [copied, setCopied] = useState(false);

  const videoSrc = item.embedUrl || (item.videoId ? `https://www.youtube.com/embed/${item.videoId}?autoplay=1&rel=0` : '');

  const handleLike = async () => {
    if (hasLiked) return;
    try {
      setHasLiked(true);
      setLikesCount((prev) => prev + 1);
      await likeSurvivalContent(item._id);
    } catch (e) {
      console.warn('Like error:', e);
    }
  };

  const handleToggleCheckItem = (idx) => {
    setCheckedList((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const quickGuide = item.quickGuide || {};
  const steps = quickGuide.steps || [];
  const dos = quickGuide.dos || [];
  const donts = quickGuide.donts || [];
  const checklist = quickGuide.emergencyChecklist || [];

  return (
    <div className="survival-modal-backdrop" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="survival-modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title and Close */}
        <div className="survival-modal-header">
          <div className="modal-header-title-box">
            <div className="modal-top-tag-row">
              <span className="badge-disaster-modal">
                {item.disasterType?.replace('_', ' ').toUpperCase()}
              </span>
              <span className="badge-category-modal">{item.category}</span>
              {item.verified && (
                <span className="badge-verified-inline">
                  <ShieldCheck size={13} /> {item.source || 'Verified Protocol'}
                </span>
              )}
            </div>
            <h2 className="survival-modal-title">{item.title}</h2>
          </div>

          <button onClick={onClose} className="btn-modal-close" title="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Video Player Frame */}
        <div className="survival-video-player-container">
          {videoSrc ? (
            <iframe
              src={videoSrc}
              title={item.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="youtube-responsive-iframe"
            />
          ) : (
            <div className="video-fallback-box">
              <p>Video feed unavailable.</p>
            </div>
          )}
        </div>

        {/* Meta Bar Actions (Likes, Bookmarks, Complete, Share) */}
        <div className="survival-modal-action-bar">
          <div className="action-bar-left">
            <button
              onClick={handleLike}
              className={`modal-btn-action ${hasLiked ? 'active-liked' : ''}`}
            >
              <Heart size={15} className={hasLiked ? 'fill-rose-500' : ''} />
              <span>{likesCount} Likes</span>
            </button>

            <button
              onClick={() => onToggleBookmark && onToggleBookmark(item)}
              className={`modal-btn-action ${isBookmarked ? 'active-bookmarked' : ''}`}
            >
              {isBookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
              <span>{isBookmarked ? 'Saved to Bookmarks' : 'Bookmark Lesson'}</span>
            </button>

            <button
              onClick={() => onToggleCompleted && onToggleCompleted(item._id)}
              className={`modal-btn-action ${isCompleted ? 'active-completed' : ''}`}
            >
              <CheckCircle2 size={15} />
              <span>{isCompleted ? 'Completed' : 'Mark Completed'}</span>
            </button>
          </div>

          <div className="action-bar-right">
            <button onClick={handleShare} className="modal-btn-action" title="Copy lesson link">
              <Share2 size={15} />
              <span>{copied ? 'Link Copied!' : 'Share'}</span>
            </button>

            {item.videoUrl && (
              <a
                href={item.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="modal-btn-action external"
                title="Watch on YouTube"
              >
                <ExternalLink size={14} />
                <span>YouTube</span>
              </a>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="survival-modal-tabs">
          <button
            onClick={() => setActiveTab('steps')}
            className={`modal-tab-btn ${activeTab === 'steps' ? 'active' : ''}`}
          >
            <ListOrdered size={14} />
            <span>Survival Steps ({steps.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('dos_donts')}
            className={`modal-tab-btn ${activeTab === 'dos_donts' ? 'active' : ''}`}
          >
            <AlertTriangle size={14} />
            <span>DOs &amp; DON'Ts</span>
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className={`modal-tab-btn ${activeTab === 'checklist' ? 'active' : ''}`}
          >
            <CheckSquare size={14} />
            <span>Emergency Checklist ({checklist.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`modal-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          >
            <BookOpen size={14} />
            <span>Overview &amp; Notes</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="survival-modal-tab-body">
          {/* 1. Survival Steps */}
          {activeTab === 'steps' && (
            <div className="tab-pane-steps">
              {steps.length > 0 ? (
                <div className="steps-ordered-list">
                  {steps.map((step, idx) => (
                    <div key={idx} className="step-item-card">
                      <div className="step-number-badge">{idx + 1}</div>
                      <div className="step-text-content">
                        <p>{step}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">Follow standard evacuation and emergency response instructions.</p>
              )}
            </div>
          )}

          {/* 2. DOs & DON'Ts */}
          {activeTab === 'dos_donts' && (
            <div className="tab-pane-dos-donts">
              <div className="dos-column">
                <div className="dos-col-header">
                  <CheckCircle2 size={16} className="text-emerald" />
                  <h4>CRITICAL DO's</h4>
                </div>
                <ul className="dos-items-list">
                  {dos.map((d, idx) => (
                    <li key={idx}>
                      <span className="dot-green">✓</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="donts-column">
                <div className="donts-col-header">
                  <AlertTriangle size={16} className="text-rose" />
                  <h4>CRITICAL DON'Ts</h4>
                </div>
                <ul className="donts-items-list">
                  {donts.map((d, idx) => (
                    <li key={idx}>
                      <span className="dot-red">✕</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* 3. Emergency Checklist */}
          {activeTab === 'checklist' && (
            <div className="tab-pane-checklist">
              <div className="checklist-intro-bar">
                <p>Check off preparedness items as you equip your emergency grab-and-go kit:</p>
              </div>
              <div className="checklist-items-grid">
                {checklist.map((itemStr, idx) => {
                  const isChecked = !!checkedList[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => handleToggleCheckItem(idx)}
                      className={`checklist-item-row ${isChecked ? 'checked' : ''}`}
                    >
                      <button className="btn-checkbox">
                        {isChecked ? (
                          <CheckSquare size={18} className="text-emerald" />
                        ) : (
                          <Square size={18} className="text-muted" />
                        )}
                      </button>
                      <span className="checklist-label">{itemStr}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Overview & Notes */}
          {activeTab === 'overview' && (
            <div className="tab-pane-overview">
              <div className="overview-meta-strip">
                <div className="overview-metric">
                  <span className="metric-label">Duration:</span>
                  <span className="metric-val">{item.duration || '8 mins'}</span>
                </div>
                <div className="overview-metric">
                  <span className="metric-label">Difficulty:</span>
                  <span className="metric-val">{item.difficulty || 'Beginner'}</span>
                </div>
                <div className="overview-metric">
                  <span className="metric-label">Authority:</span>
                  <span className="metric-val">{item.source || 'FEMA & NDRF'}</span>
                </div>
                <div className="overview-metric">
                  <span className="metric-label">Total Views:</span>
                  <span className="metric-val">{(item.views || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="overview-desc-box">
                <h4>Description &amp; Safety Objectives</h4>
                <p>{item.description || 'Verified disaster education course from certified survival specialists.'}</p>
              </div>

              {item.tags?.length > 0 && (
                <div className="overview-tags-box">
                  <span className="tags-label">Related Topics:</span>
                  <div className="tags-chips-wrapper">
                    {item.tags.map((t, idx) => (
                      <span key={idx} className="tag-chip">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SurvivalVideoModal;
