import mongoose from 'mongoose';

const shelterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Shelter name is required'],
      trim: true,
    },
    type: {
      type: String,
      default: 'shelter',
      trim: true,
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: -180,
      max: 180,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    capacity: {
      totalBeds: {
        type: Number,
        default: 0,
        min: 0,
      },
      availableBeds: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    facilities: {
      foodAvailable: {
        type: Boolean,
        default: true,
      },
      medicalAvailable: {
        type: Boolean,
        default: false,
      },
      waterAvailable: {
        type: Boolean,
        default: true,
      },
      powerAvailable: {
        type: Boolean,
        default: true,
      },
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'full', 'closed'],
        message: 'Status must be active, full, or closed',
      },
      default: 'active',
    },
    source: {
      type: String,
      enum: {
        values: ['overpass', 'system'],
        message: 'Source must be either overpass or system',
      },
      default: 'system',
    },
    recommended: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes for high performance geospatial & status lookups ─────────────────
shelterSchema.index({ latitude: 1, longitude: 1 });
shelterSchema.index({ status: 1 });
shelterSchema.index({ source: 1 });
shelterSchema.index({ recommended: 1 });
shelterSchema.index({ 'capacity.availableBeds': -1 });

const Shelter = mongoose.model('Shelter', shelterSchema);

export default Shelter;
