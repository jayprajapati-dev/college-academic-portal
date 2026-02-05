const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  enrollmentId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /.+\@.+\..+/
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false // Don't return password by default
  },
  role: {
    type: String,
    enum: ['Admin', 'Student'],
    default: 'Student'
  },
  securityQuestion: {
    type: String,
    required: true
  },
  securityAnswer: {
    type: String,
    required: true,
    select: false // Don't return answer by default
  },
  department: {
    type: String, // For filtering/analytics
    default: null
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    default: null
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Hash security answer before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('securityAnswer')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.securityAnswer = await bcrypt.hash(this.securityAnswer, salt);
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Method to compare security answer
userSchema.methods.compareSecurityAnswer = async function(answer) {
  return await bcrypt.compare(answer, this.securityAnswer);
};

// Method to remove sensitive data
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.securityAnswer;
  return user;
};

module.exports = mongoose.model('User', userSchema);
