import mongoose from 'mongoose';

const rescueSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['dispatched', 'on_site', 'completed'],
      default: 'dispatched',
    },
    notes: { type: String },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    sos: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SOS',
    },
    disaster: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Disaster',
    },
  },
  { timestamps: true }
);

const Rescue = mongoose.model('Rescue', rescueSchema);

export default Rescue;
