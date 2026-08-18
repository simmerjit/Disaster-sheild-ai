import mongoose from 'mongoose';

const sosSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: [true, 'SOS message is required'],
      trim: true,
    },
    senderName: {
      type: String,
      default: 'Emergency Caller',
      trim: true,
    },
    senderPhone: {
      type: String,
      default: 'Unknown',
      trim: true,
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
    },
    address: {
      type: String,
      default: 'Emergency Location',
    },
    peopleTrapped: {
      type: Number,
      default: 1,
      min: 1,
    },
    urgency: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'critical',
    },
    emergencyType: {
      type: String,
      enum: ['flood_trapped', 'building_collapse', 'medical_critical', 'fire_hazard', 'general_distress'],
      default: 'general_distress',
    },
    status: {
      type: String,
      enum: ['pending', 'dispatched', 'acknowledged', 'resolved'],
      default: 'pending',
    },
    assignedTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RescueTeam',
    },
    assignedTeamName: {
      type: String,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    disasterId: {
      type: String,
    },
  },
  { timestamps: true }
);

const SOS = mongoose.model('SOS', sosSchema);

export default SOS;
