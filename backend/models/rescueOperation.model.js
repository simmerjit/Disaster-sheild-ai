import mongoose from 'mongoose';

const rescueOperationSchema = new mongoose.Schema(
  {
    disasterId: {
      type: String,
      required: [true, 'Disaster ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Operation title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
    },
    status: {
      type: String,
      enum: ['planned', 'active', 'paused', 'completed', 'cancelled'],
      default: 'active',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'high',
    },
    organization: {
      type: String,
      default: 'National Disaster Response Force (NDRF)',
      trim: true,
    },
    teamsDeployed: {
      type: Number,
      default: 1,
      min: 0,
    },
    peopleRescued: {
      type: Number,
      default: 0,
      min: 0,
    },
    peopleInjured: {
      type: Number,
      default: 0,
      min: 0,
    },
    peopleMissing: {
      type: Number,
      default: 0,
      min: 0,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    source: {
      type: String,
      default: 'Official Emergency Response',
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

const RescueOperation = mongoose.model('RescueOperation', rescueOperationSchema);

export default RescueOperation;
