import mongoose from 'mongoose';

const survivalContentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required for survival content'],
      trim: true,
      maxlength: [250, 'Title cannot exceed 250 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    disasterType: {
      type: String,
      required: [true, 'Disaster type is required'],
      trim: true,
      lowercase: true,
      enum: [
        'earthquake',
        'flood',
        'cyclone',
        'wildfire',
        'tsunami',
        'landslide',
        'storm',
        'heatwave',
        'pandemic',
        'power_outage',
        'emergency_first_aid',
        'survival_skills',
        'water_purification',
        'fire_safety',
        'search_and_rescue',
        'general',
      ],
      default: 'general',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: [
        'Basic Survival',
        'Emergency Response',
        'Medical First Aid',
        'Disaster Preparedness',
        'Shelter Building',
        'Fire Making',
        'Water Purification',
        'Search and Rescue',
        'Food Storage',
        'Communication',
        'Navigation',
        'Emergency Kits',
        'Community Safety',
        'Children Safety',
        'Pet Safety',
      ],
      default: 'Disaster Preparedness',
    },
    videoUrl: {
      type: String,
      required: [true, 'Video URL is required'],
      trim: true,
    },
    videoId: {
      type: String,
      trim: true,
      default: '',
    },
    embedUrl: {
      type: String,
      trim: true,
      default: '',
    },
    thumbnail: {
      type: String,
      trim: true,
      default: '',
    },
    channelName: {
      type: String,
      trim: true,
      default: 'Disaster Shield Academy',
    },
    duration: {
      type: String,
      trim: true,
      default: '8 mins',
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    estimatedTime: {
      type: String,
      default: '10 mins read/watch',
    },
    tags: {
      type: [String],
      default: [],
    },
    language: {
      type: String,
      default: 'en',
    },
    source: {
      type: String,
      default: 'NDRF / FEMA / Red Cross / YouTube',
    },
    verified: {
      type: Boolean,
      default: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    quickGuide: {
      steps: { type: [String], default: [] },
      dos: { type: [String], default: [] },
      donts: { type: [String], default: [] },
      emergencyChecklist: { type: [String], default: [] },
    },
  },
  {
    timestamps: true,
  }
);

// Search & performance indexes
survivalContentSchema.index({ title: 'text', description: 'text', tags: 'text' });
survivalContentSchema.index({ disasterType: 1, category: 1 });
survivalContentSchema.index({ views: -1 });
survivalContentSchema.index({ featured: -1, createdAt: -1 });

// Helper method to extract YouTube video ID and build standard embed URLs
survivalContentSchema.pre('save', function () {
  if (this.videoUrl) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = this.videoUrl.match(regExp);
    if (match && match[2].length === 11) {
      this.videoId = match[2];
      this.embedUrl = `https://www.youtube.com/embed/${match[2]}`;
      if (!this.thumbnail) {
        this.thumbnail = `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
      }
    } else if (this.videoUrl.includes('embed/')) {
      this.embedUrl = this.videoUrl;
    }
  }
});

const SurvivalContent = mongoose.model('SurvivalContent', survivalContentSchema);

export default SurvivalContent;
