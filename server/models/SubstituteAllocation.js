const mongoose = require('mongoose');

const substituteAllocationSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    leaveRequestId: { type: String, required: true },
    originalFacultyId: { type: String, required: true },
    originalFacultyName: { type: String, required: true },
    substituteFacultyId: { type: String, required: true },
    substituteFacultyName: { type: String, required: true },
    batchId: { type: String, required: true },
    batchName: { type: String, required: true },
    subjectId: { type: String, required: true },
    subjectName: { type: String, required: true },
    date: { type: String, required: true },
    day: { type: String, required: true },
    period: { type: Number, required: true },
    status: {
      type: String,
      enum: ['Confirmed', 'Completed', 'Cancelled'],
      default: 'Confirmed'
    },
    allocatedBy: { type: String, required: true },
    allocatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SubstituteAllocation', substituteAllocationSchema);
