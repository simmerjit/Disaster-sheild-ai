import mongoose from 'mongoose';

const disasterImpactSchema = new mongoose.Schema(
  {
    disasterId: {
      type: String,
      required: [true, 'Disaster ID is required'],
      index: true,
    },
    affected: {
      type: Number,
      default: null,
      min: 0,
    },
    rescued: {
      type: Number,
      default: null,
      min: 0,
    },
    injured: {
      type: Number,
      default: null,
      min: 0,
    },
    missing: {
      type: Number,
      default: null,
      min: 0,
    },
    deceased: {
      type: Number,
      default: null,
      min: 0,
    },
    source: {
      type: String,
      required: [true, 'Information source is required'],
      trim: true,
    },
    sourceUrl: {
      type: String,
      trim: true,
    },
    verified: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const DisasterImpact = mongoose.model('DisasterImpact', disasterImpactSchema);

export default DisasterImpact;
