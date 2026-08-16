import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    imageUrl: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    disaster: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Disaster',
    },
  },
  { timestamps: true }
);

const Report = mongoose.model('Report', reportSchema);

export default Report;
