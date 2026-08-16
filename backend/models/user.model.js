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
    role: {
      type: String,
      enum: ['citizen', 'rescue_worker', 'admin'],
      default: 'citizen',
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
    },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
