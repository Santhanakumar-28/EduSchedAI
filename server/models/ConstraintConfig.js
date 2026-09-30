const mongoose = require('mongoose');

const ConstraintConfigSchema = new mongoose.Schema(
  {
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      unique: true
    },
    activeDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    periodsPerDay: {
      type: Number,
      required: true,
      default: 7,
      min: 4,
      max: 10
    },
    slotDurationMinutes: {
      type: Number,
      default: 50
    },
    startTime: {
      type: String,
      default: '09:00'
    },
    lunchBreakPeriod: {
      type: Number,
      default: 4 // Period index 4
    },
    lunchDurationMinutes: {
      type: Number,
      default: 50
    },
    maxConsecutiveLectures: {
      type: Number,
      default: 2
    },
    maxDailyFacultyHours: {
      type: Number,
      default: 4
    },
    weights: {
      workloadBalance: { type: Number, default: 80 },
      minimizeStudentGaps: { type: Number, default: 70 },
      minimizeFacultyGaps: { type: Number, default: 60 },
      honorFacultyPreferences: { type: Number, default: 50 },
      evenSubjectSpread: { type: Number, default: 65 }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ConstraintConfig', ConstraintConfigSchema);
