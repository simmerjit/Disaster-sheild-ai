import mongoose from 'mongoose';

const sosSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: [true, 'SOS message is required'],
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'acknowledged', 'resolved'],
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

const SOS = mongoose.model('SOS', sosSchema);

export default SOS;
