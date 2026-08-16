import mongoose from 'mongoose';

const reliefOrganizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    donationUrl: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
      trim: true,
    },
    services: [
      {
        type: String,
        enum: [
          'food',
          'water',
          'medical',
          'shelter',
          'rescue',
          'clothing',
          'financial_assistance',
          'rehabilitation',
          'counseling',
        ],
      },
    ],
    areasSupported: [
      {
        type: String,
        trim: true,
      },
    ],
    verified: {
      type: Boolean,
      default: false,
    },
    verificationSource: {
      type: String,
      trim: true,
    },
    verificationUrl: {
      type: String,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const ReliefOrganization = mongoose.model('ReliefOrganization', reliefOrganizationSchema);

export default ReliefOrganization;
