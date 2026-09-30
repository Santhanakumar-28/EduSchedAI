const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Please provide subject code (e.g. CS401)'],
      unique: true,
      uppercase: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Please provide subject name'],
      trim: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8
    },
    type: {
      type: String,
      enum: ['Theory', 'Lab', 'Tutorial'],
      default: 'Theory'
    },
    credits: {
      type: Number,
      required: true,
      default: 3
    },
    weeklyLectures: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
      default: 4
    },
    labDurationHours: {
      type: Number,
      default: 1, // For labs, typically 2 or 3 continuous periods
      min: 1,
      max: 4
    },
    preferredRoomType: {
      type: String,
      enum: ['LectureHall', 'ComputerLab', 'ElectronicsLab', 'HardwareLab', 'SeminarHall', 'TutorialRoom'],
      default: 'LectureHall'
    },
    assignedFacultyIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty'
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

SubjectSchema.index({ departmentId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Subject', SubjectSchema);
