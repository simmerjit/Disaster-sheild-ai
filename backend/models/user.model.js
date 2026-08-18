import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      default: 'secure123',
    },
    role: {
      type: String,
      enum: ['citizen', 'rescue_worker', 'coordinator', 'admin'],
      default: 'citizen',
    },
    organization: {
      type: String,
      default: 'General Public',
      trim: true,
    },
    specialization: {
      type: String,
      default: 'general_sar',
    },
    teamCode: {
      type: String,
      trim: true,
    },
    rescueTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RescueTeam',
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
    },
    location: {
      latitude: { type: Number, default: 28.6139 },
      longitude: { type: Number, default: 77.209 },
      address: { type: String, default: 'New Delhi, India' },
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
