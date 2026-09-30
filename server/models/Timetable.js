const mongoose = require('mongoose');

const ScheduleSlotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true
    },
    period: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true
    },
    type: {
      type: String,
      enum: ['Theory', 'Lab', 'Tutorial'],
      default: 'Theory'
    },
    isLabBlock: {
      type: Boolean,
      default: false
    },
    slotDuration: {
      type: Number,
      default: 1
    }
  },
  { _id: true }
);

const TimetableSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide timetable title'],
      trim: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    semester: {
      type: Number,
      required: true
    },
    academicYear: {
      type: String,
      required: true,
      default: '2026-2027'
    },
    status: {
      type: String,
      enum: ['Draft', 'Generated', 'Published', 'Archived'],
      default: 'Generated'
    },
    schedule: [ScheduleSlotSchema],
    metrics: {
      executionTimeMs: { type: Number, default: 0 },
      hardViolations: { type: Number, default: 0 },
      softPenaltyScore: { type: Number, default: 0 },
      workloadGiniIndex: { type: Number, default: 0 },
      roomUtilizationPercent: { type: Number, default: 0 },
      totalSessionsScheduled: { type: Number, default: 0 }
    },
    version: {
      type: Number,
      default: 1
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

TimetableSchema.index({ departmentId: 1, semester: 1, academicYear: 1 });

module.exports = mongoose.model('Timetable', TimetableSchema);
