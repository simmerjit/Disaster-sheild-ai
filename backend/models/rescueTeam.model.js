import mongoose from 'mongoose';

const rescueTeamSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
    },
    teamCode: {
      type: String,
      unique: true,
      trim: true,
    },
    organization: {
      type: String,
      default: 'National Disaster Response Force (NDRF)',
      trim: true,
    },
    specialization: {
      type: String,
      enum: [
        'general_sar',
        'flood_water',
        'urban_search_rescue',
        'medical_evac',
        'fire_hazmat',
        'cyclone_storm',
        'earthquake_collapse',
      ],
      default: 'general_sar',
    },
    leaderName: {
      type: String,
      default: 'Team Commander',
      trim: true,
    },
    contactPhone: {
      type: String,
      default: '+91 1078',
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      default: 'rescue123',
    },
    capacityMembers: {
      type: Number,
      default: 12,
    },
    equipment: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ['available', 'en_route', 'on_scene', 'standby', 'offline'],
      default: 'available',
    },
    location: {
      latitude: {
        type: Number,
        required: true,
        default: 28.6139,
      },
      longitude: {
        type: Number,
        required: true,
        default: 77.209,
      },
      address: {
        type: String,
        default: 'Command Post, New Delhi',
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    currentMission: {
      disasterId: { type: String },
      title: { type: String },
      startedAt: { type: Date },
      destination: {
        latitude: Number,
        longitude: Number,
        address: String,
      },
    },
    stats: {
      missionsCompleted: { type: Number, default: 0 },
      peopleRescued: { type: Number, default: 0 },
      casualtiesTreated: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const RescueTeam = mongoose.model('RescueTeam', rescueTeamSchema);

export default RescueTeam;
