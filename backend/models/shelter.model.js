import mongoose from 'mongoose';

const shelterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Shelter name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
    },
    latitude: { type: Number },
    longitude: { type: Number },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: 1,
    },
    currentOccupancy: {
      type: Number,
      default: 0,
      min: 0,
    },
    contact: { type: String },
    disaster: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Disaster',
    },
  },
  { timestamps: true }
);

const Shelter = mongoose.model('Shelter', shelterSchema);

export default Shelter;
