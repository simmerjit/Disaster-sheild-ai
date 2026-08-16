import mongoose from 'mongoose';

const chatMessageSubSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['user', 'bot', 'system'],
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: 'General',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const chatSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      sparse: true,
      index: true,
    },
    userCoordinates: {
      latitude: Number,
      longitude: Number,
    },
    messages: [chatMessageSubSchema],
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    // TTL index: MongoDB automatically removes inactive chat sessions after 30 days
    expireAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      index: { expires: '0s' },
    },
  },
  { timestamps: true }
);

// Compound indexes
chatSessionSchema.index({ sessionId: 1, lastActivity: -1 });

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

export default ChatSession;
