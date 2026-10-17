const mongoose = require('mongoose');

const StudentRecordSchema = new mongoose.Schema(
  {
    studentId: String,
    rollNo: String,
    name: String,
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late'],
      default: 'Present'
    }
  },
  { _id: false }
);

const AttendanceSessionSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.Mixed,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    date: {
      type: String,
      required: true
    },
    day: {
      type: String,
      required: true
    },
    period: {
      type: Number,
      required: true
    },
    batchId: {
      type: String,
      required: true
    },
    subjectId: {
      type: String,
      required: true
    },
    subjectCode: String,
    subjectName: String,
    markedByFacultyId: String,
    markedByFacultyName: String,
    records: [StudentRecordSchema]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AttendanceSession', AttendanceSessionSchema);
