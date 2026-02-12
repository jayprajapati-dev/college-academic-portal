const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  mobile: {
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
  },
  enrollmentNumber: {
    type: String,
    sparse: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'hod', 'admin'],
    default: 'student',
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester'
  },
  assignedSubjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  assignedHOD: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending_first_login', 'active', 'disabled'],
    default: 'active'
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  tempPassword: {
    type: String,
    select: false
  },
  passwordChangeRequired: {
    type: Boolean,
    default: false
  },
  passwordSetupRequired: {
    type: Boolean,
    default: false
  },
  passwordSetupCompletedAt: {
    type: Date,
    default: null
  },
  securityQuestion: {
    type: String,
    enum: [
      "What is your mother's maiden name?",
      "What was the name of your first pet?",
      "What city were you born in?",
      "What is your favorite book?",
      "What is your favorite movie?",
      "What was the name of your first school?",
      "What is your favorite food?",
      "What is your favorite sport?"
    ]
  },
  securityAnswer: {
    type: String,
    select: false
  },
  caseInsensitiveAnswer: {
    type: Boolean,
    default: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  addedByRole: {
    type: String,
    enum: ['admin', 'hod', 'system'],
    default: 'system'
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  branches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  }],
  semesters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester'
  }],
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  permissions: [{
    type: String
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Hash security answer before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('securityAnswer') || !this.securityAnswer) {
    return next();
  }
  
  let answer = this.securityAnswer;
  if (this.caseInsensitiveAnswer) {
    answer = answer.toLowerCase();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.securityAnswer = await bcrypt.hash(answer, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to compare security answer
userSchema.methods.compareSecurityAnswer = async function(candidateAnswer) {
  let answer = candidateAnswer;
  if (this.caseInsensitiveAnswer) {
    answer = answer.toLowerCase();
  }
  return await bcrypt.compare(answer, this.securityAnswer);
};

module.exports = mongoose.model('User', userSchema);
