const mongoose = require('mongoose');

const AffectedSlotSchema = new mongoose.Schema(
  {
    day: String,
    period: Number,
    subjectId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Subject'
    },
    batchId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Batch'
    },
    roomId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Room'
    }
  },
  { _id: false }
);

const LeaveRequestSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.Mixed,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    applicantType: {
      type: String,
      enum: ['Faculty', 'Student'],
      default: 'Faculty'
    },
    // Faculty applicant fields
    facultyId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Faculty',
      default: null
    },
    facultyName: {
      type: String,
      default: null
    },
    cadre: {
      type: String,
      default: null
    },
    // Student applicant fields
    studentId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'User',
      default: null
    },
    studentRollNo: {
      type: String,
      default: null
    },
    studentName: {
      type: String,
      default: null
    },
    // Class / Department Scope
    batchId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Batch',
      default: null
    },
    batchName: {
      type: String,
      default: null
    },
    departmentId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Department',
      default: 'dept_cse_01'
    },
    // Dates and Timing
    leaveType: {
      type: String,
      enum: ['Casual', 'Duty', 'Medical', 'Academic', 'Personal', 'Emergency'],
      default: 'Casual'
    },
    leaveDate: {
      type: String,
      default: null
    },
    startDate: {
      type: String,
      default: null
    },
    endDate: {
      type: String,
      default: null
    },
    day: String,
    period: Number,
    subjectId: mongoose.Schema.Types.Mixed,
    subjectName: String,
    roomId: mongoose.Schema.Types.Mixed,
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
    // Faculty substitute recommendations
    recommendedSubstitutes: [
      {
        facultyId: {
          type: mongoose.Schema.Types.Mixed,
          ref: 'Faculty'
        },
        currentLoad: Number,
        matchScore: Number
      }
    ],
    substituteFacultyId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Faculty',
      default: null
    },
    substituteFacultyName: {
      type: String,
      default: null
    },
    // Decision / Review Details
    decisionBy: {
      type: String,
      default: null
    },
    reviewedByRole: {
      type: String,
      default: null
    },
    reviewComment: {
      type: String,
      default: null
    },
    approvedBy: {
      type: mongoose.Schema.Types.Mixed,
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
LeaveRequestSchema.index({ batchId: 1, applicantType: 1 });

module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);
