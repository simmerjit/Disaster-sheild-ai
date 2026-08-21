import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  UploadCloud,
  Video,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { createSurvivalContent } from '../../services/survivalApi';

const DISASTER_TYPES = [
  'earthquake',
  'flood',
  'cyclone',
  'wildfire',
  'tsunami',
  'landslide',
  'storm',
  'heatwave',
  'pandemic',
  'power_outage',
  'emergency_first_aid',
  'survival_skills',
  'water_purification',
  'fire_safety',
  'search_and_rescue',
  'general',
];

const CATEGORIES = [
  'Basic Survival',
  'Emergency Response',
  'Medical First Aid',
  'Disaster Preparedness',
  'Shelter Building',
  'Fire Making',
  'Water Purification',
  'Search and Rescue',
  'Food Storage',
  'Communication',
  'Navigation',
  'Emergency Kits',
  'Community Safety',
  'Children Safety',
  'Pet Safety',
];

export const UploadSurvivalModal = ({ onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [disasterType, setDisasterType] = useState('earthquake');
  const [category, setCategory] = useState('Disaster Preparedness');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [duration, setDuration] = useState('8 mins');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('Civil Defense / Disaster Shield Verified');
  const [steps, setSteps] = useState(['', '', '']);
  const [dos, setDos] = useState('');
  const [donts, setDonts] = useState('');
  const [checklist, setChecklist] = useState('');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleStepChange = (index, value) => {
    const updated = [...steps];
    updated[index] = value;
    setSteps(updated);
  };

  const handleAddStep = () => {
    setSteps([...steps, '']);
  };

  const handleRemoveStep = (index) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) {
      setError('Title and YouTube Video URL are required.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        videoUrl: videoUrl.trim(),
        disasterType,
        category,
        difficulty,
        duration,
        description: description.trim(),
        source: source.trim(),
        tags: tags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
        quickGuide: {
          steps: steps.map((s) => s.trim()).filter(Boolean),
          dos: dos
            .split('\n')
            .map((d) => d.trim())
            .filter(Boolean),
          donts: donts
            .split('\n')
            .map((d) => d.trim())
            .filter(Boolean),
          emergencyChecklist: checklist
            .split('\n')
            .map((c) => c.trim())
            .filter(Boolean),
        },
      };

      const res = await createSurvivalContent(payload);
      if (onSuccess) onSuccess(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to upload survival tutorial.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="survival-modal-backdrop" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="survival-upload-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="upload-modal-header">
          <div className="upload-title-row">
            <UploadCloud size={22} className="text-emerald" />
            <div>
              <h3>Publish Disaster Survival Training</h3>
              <p>Contribute trusted emergency videos, step-by-step actions, and life-saving checklists.</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-modal-close">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="upload-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="upload-modal-form">
          <div className="form-group-grid">
            <div className="form-field full-width">
              <label>Lesson Title *</label>
              <input
                type="text"
                placeholder="e.g., Earthquake Structural Safety & Evacuation Drills"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-field full-width">
              <label>YouTube Video URL *</label>
              <div className="input-with-icon">
                <Video size={16} className="input-icon text-red-500" />
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label>Disaster Type</label>
              <select value={disasterType} onChange={(e) => setDisasterType(e.target.value)}>
                {DISASTER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="Beginner">Beginner (Civilians & Families)</option>
                <option value="Intermediate">Intermediate (Community Volunteers)</option>
                <option value="Advanced">Advanced (First Responders / Tactical)</option>
              </select>
            </div>

            <div className="form-field">
              <label>Duration</label>
              <input
                type="text"
                placeholder="e.g., 8:30"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <label>Description &amp; Safety Overview</label>
            <textarea
              rows={3}
              placeholder="Summary of life-saving skills taught in this training video..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Dynamic Action Steps */}
          <div className="form-field-dynamic-steps">
            <div className="dynamic-steps-header">
              <label>Step-by-Step Emergency Action Protocol</label>
              <button type="button" onClick={handleAddStep} className="btn-add-step">
                <Plus size={13} /> Add Step
              </button>
            </div>
            {steps.map((step, idx) => (
              <div key={idx} className="step-input-row">
                <span className="step-idx">{idx + 1}</span>
                <input
                  type="text"
                  placeholder={`Step ${idx + 1}: e.g. Drop to hands and knees immediately...`}
                  value={step}
                  onChange={(e) => handleStepChange(idx, e.target.value)}
                />
                {steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveStep(idx)}
                    className="btn-remove-step"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="form-group-grid">
            <div className="form-field">
              <label>Critical DOs (1 per line)</label>
              <textarea
                rows={3}
                placeholder="Stay indoors until shaking stops&#10;Protect head and neck with arms"
                value={dos}
                onChange={(e) => setDos(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Critical DONTs (1 per line)</label>
              <textarea
                rows={3}
                placeholder="Do not use elevators&#10;Do not run outside during shaking"
                value={donts}
                onChange={(e) => setDonts(e.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <label>Emergency Kit Checklist Items (1 per line)</label>
            <textarea
              rows={2}
              placeholder="First aid trauma kit&#10;Water filter bottle&#10;Emergency whistle&#10;N95 mask"
              value={checklist}
              onChange={(e) => setChecklist(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label>Search Tags (comma separated)</label>
            <input
              type="text"
              placeholder="earthquake, evacuation, triage, first aid"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <div className="upload-modal-footer">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-submit-publish">
              {submitting ? 'Publishing...' : 'Publish to Survival Academy'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default UploadSurvivalModal;
