import mongoose from 'mongoose';

const disasterSchema = new mongoose.Schema(
  {
    externalId: {
      type: String,
      sparse: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'earthquake',
        'cyclone',
        'flood',
        'wildfire',
        'volcano',
        'storm',
        'drought',
        'landslide',
        'tsunami',
        'other',
      ],
      required: [true, 'Disaster type is required'],
    },
    description: {
      type: String,
      default: '',
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    magnitude: {
      type: Number,
    },
    depth: {
      type: Number, // In km (for earthquakes)
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
    },
    affectedRadius: {
      type: Number, // In kilometers (for Leaflet circle visualization)
      default: 10,
    },
    country: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    source: {
      type: String,
      enum: ['GDACS', 'USGS', 'NASA_EONET', 'MANUAL', 'USER_REPORT'],
      default: 'MANUAL',
    },
    status: {
      type: String,
      enum: ['active', 'resolved'],
      default: 'active',
    },
    link: {
      type: String,
      default: '',
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

const Disaster = mongoose.model('Disaster', disasterSchema);

export default Disaster;
