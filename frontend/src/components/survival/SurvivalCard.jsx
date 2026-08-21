import React from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Clock,
  Eye,
  Heart,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ShieldCheck,
  Award,
  BookOpen,
} from 'lucide-react';

export const SurvivalCard = ({
  item,
  onOpenVideo,
  isBookmarked = false,
  onToggleBookmark,
  isCompleted = false,
  onToggleCompleted,
}) => {
  if (!item) return null;

  const difficultyClass =
    item.difficulty === 'Advanced'
      ? 'diff-advanced'
      : item.difficulty === 'Intermediate'
      ? 'diff-intermediate'
      : 'diff-beginner';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`survival-card ${isCompleted ? 'is-completed' : ''} ${item.featured ? 'is-featured' : ''}`}
      onClick={() => onOpenVideo && onOpenVideo(item)}
    >
      {/* Thumbnail with overlay badge & play icon */}
      <div className="survival-card-media">
        <img
          src={item.thumbnail || `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`}
          alt={item.title}
          loading="lazy"
          className="survival-card-thumb"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=60';
          }}
        />

        <div className="media-gradient-overlay" />

        {/* Play Button Trigger */}
        <div className="play-button-overlay">
          <div className="play-circle-icon">
            <Play size={20} className="fill-white" />
          </div>
        </div>

        {/* Top Badges */}
        <div className="media-top-badges">
          <span className="badge-disaster-type">
            {item.disasterType?.replace('_', ' ').toUpperCase()}
          </span>

          {item.verified && (
            <span className="badge-verified-authority" title="Verified by Disaster Response Authority">
              <ShieldCheck size={12} />
              <span>Verified</span>
            </span>
          )}
        </div>

        {/* Bottom Duration & Difficulty bar */}
        <div className="media-bottom-meta">
          <span className="meta-duration-pill">
            <Clock size={11} />
            {item.duration || '8 mins'}
          </span>
          <span className={`meta-diff-pill ${difficultyClass}`}>
            {item.difficulty || 'Beginner'}
          </span>
        </div>
      </div>

      {/* Content Info */}
      <div className="survival-card-body">
        <div className="card-category-strip">
          <span className="card-category-name">{item.category}</span>
          {item.featured && (
            <span className="badge-featured-gold">
              <Award size={11} /> Featured
            </span>
          )}
        </div>

        <h3 className="survival-card-title" title={item.title}>
          {item.title}
        </h3>

        <p className="survival-card-desc">
          {item.description || 'Essential practical emergency instructions and verified survival actions.'}
        </p>

        {/* Quick Guide Indicator */}
        {item.quickGuide?.steps?.length > 0 && (
          <div className="card-quick-guide-preview">
            <BookOpen size={12} className="text-emerald" />
            <span>Includes {item.quickGuide.steps.length}-Step Emergency Protocol</span>
          </div>
        )}

        {/* Card Footer Actions */}
        <div className="survival-card-footer" onClick={(e) => e.stopPropagation()}>
          <div className="footer-stats-left">
            <span className="stat-item" title={`${(item.views || 0).toLocaleString()} Views`}>
              <Eye size={13} />
              {item.views >= 1000 ? `${(item.views / 1000).toFixed(1)}k` : item.views || 0}
            </span>
            <span className="stat-item" title={`${(item.likes || 0).toLocaleString()} Likes`}>
              <Heart size={13} />
              {item.likes || 0}
            </span>
          </div>

          <div className="footer-actions-right">
            {/* Toggle Completed */}
            <button
              onClick={() => onToggleCompleted && onToggleCompleted(item._id)}
              className={`btn-icon-action ${isCompleted ? 'active-completed' : ''}`}
              title={isCompleted ? 'Marked as completed' : 'Mark lesson as completed'}
            >
              <CheckCircle2 size={16} />
            </button>

            {/* Toggle Bookmark */}
            <button
              onClick={() => onToggleBookmark && onToggleBookmark(item)}
              className={`btn-icon-action ${isBookmarked ? 'active-bookmarked' : ''}`}
              title={isBookmarked ? 'Saved to Bookmarks' : 'Save for offline survival'}
            >
              {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SurvivalCard;
