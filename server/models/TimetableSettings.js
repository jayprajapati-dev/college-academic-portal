const mongoose = require('mongoose');

const timetableSettingsSchema = new mongoose.Schema(
  {
    dayStartTime: {
      type: String,
      default: '10:30',
      validate: {
        validator: (value) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(String(value || '')),
        message: 'dayStartTime must be in HH:MM format'
      }
    },
    dayEndTime: {
      type: String,
      default: '18:00',
      validate: {
        validator: (value) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(String(value || '')),
        message: 'dayEndTime must be in HH:MM format'
      }
    },
    slotMinutes: {
      type: Number,
      min: 10,
      max: 180,
      default: 60
    },
    maxSlot: {
      type: Number,
      min: 1,
      max: 24,
      default: 7
    },
    breakSlots: {
      type: [Number],
      default: [],
      validate: {
        validator: (value) => Array.isArray(value) && value.every((item) => Number.isInteger(item) && item > 0),
        message: 'breakSlots must contain positive integer values only'
      }
    },
    breakWindows: {
      type: [{
        startTime: {
          type: String,
          required: true,
          validate: {
            validator: (value) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(String(value || '')),
            message: 'break window startTime must be in HH:MM format'
          }
        },
        endTime: {
          type: String,
          required: true,
          validate: {
            validator: (value) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(String(value || '')),
            message: 'break window endTime must be in HH:MM format'
          }
        },
        label: {
          type: String,
          default: 'Break'
        }
      }],
      default: [
        { startTime: '12:30', endTime: '13:00', label: 'Lunch Break' },
        { startTime: '16:00', endTime: '16:10', label: 'Short Break' }
      ]
    },
    teacherMaxHoursPerDay: {
      type: Number,
      min: 1,
      max: 12,
      default: 6
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('TimetableSettings', timetableSettingsSchema);
