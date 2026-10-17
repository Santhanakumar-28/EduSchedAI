const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.Mixed,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    name: {
      type: String,
      required: [true, 'Please provide batch/section name (e.g. CSE-A)'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Please provide batch code (e.g. CSE-A-2026)'],
      trim: true,
      uppercase: true
    },
    departmentId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Department',
      required: true
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8
    },
    academicYear: {
      type: String,
      required: true,
      default: '2026-2027'
    },
    studentStrength: {
      type: Number,
      required: true,
      default: 60,
      min: 5
    },
    shift: {
      type: String,
      enum: ['Morning', 'General', 'Evening'],
      default: 'General'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

BatchSchema.index({ departmentId: 1, semester: 1, code: 1 });

module.exports = mongoose.model('Batch', BatchSchema);
