import mongoose from 'mongoose';

const disasterUpdateSchema = new mongoose.Schema(
  {
    disasterId: {
      type: String,
      required: [true, 'Disaster ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Update title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Update content is required'],
      trim: true,
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
    type: {
      type: String,
      enum: [
        'official_alert',
        'rescue_update',
        'evacuation',
        'shelter_update',
        'road_closure',
        'weather_update',
        'general',
      ],
      default: 'general',
    },
    verified: {
      type: Boolean,
      default: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const DisasterUpdate = mongoose.model('DisasterUpdate', disasterUpdateSchema);

export default DisasterUpdate;
