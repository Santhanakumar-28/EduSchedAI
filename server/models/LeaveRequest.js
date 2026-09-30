const mongoose = require('mongoose');

const AffectedSlotSchema = new mongoose.Schema(
  {
    day: String,
    period: Number,
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch'
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room'
    }
  },
  { _id: false }
);

const LeaveRequestSchema = new mongoose.Schema(
  {
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    leaveDate: {
      type: Date,
      required: [true, 'Please provide leave date']
    },
    affectedSlots: [AffectedSlotSchema],
    reason: {
      type: String,
      required: [true, 'Please provide reason for leave']
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
      default: 'Pending'
    },
    recommendedSubstitutes: [
      {
        facultyId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Faculty'
        },
        currentLoad: Number,
        matchScore: Number
      }
    ],
    substituteFacultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      default: null
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

LeaveRequestSchema.index({ departmentId: 1, leaveDate: 1, status: 1 });

module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);
