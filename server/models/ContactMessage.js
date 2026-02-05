const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    subject: {
      type: String,
      required: true,
      enum: ['Academic Counseling', 'Research Collaboration', 'Institutional Partnerships', 'Technical Support', 'Other']
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'replied'],
      default: 'pending'
    },
    reply: {
      message: String,
      repliedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      repliedAt: Date
    }
  },
  {
    timestamps: true
  }
);

// Add index for faster queries
contactMessageSchema.index({ userId: 1, createdAt: -1 });
contactMessageSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
