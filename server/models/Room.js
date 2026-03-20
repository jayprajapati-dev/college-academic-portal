const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNo: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Class', 'Lab'],
    default: 'Class'
  },
  buildingName: {
    type: String,
    required: true,
    trim: true,
    default: 'Main Building'
  },
  floor: {
    type: String,
    required: true,
    enum: ['Ground', '1st', '2nd', '3rd', 'Custom'],
    default: 'Ground'
  },
  customBuilding: {
    type: String,
    trim: true
  },
  customFloor: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
