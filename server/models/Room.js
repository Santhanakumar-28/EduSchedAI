const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.Mixed,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    roomNumber: {
      type: String,
      required: [true, 'Please provide room number / name (e.g. LH-101)'],
      trim: true,
      uppercase: true
    },
    building: {
      type: String,
      required: true,
      default: 'Engineering Block A'
    },
    floor: {
      type: Number,
      required: true,
      default: 1
    },
    capacity: {
      type: Number,
      required: [true, 'Please provide seating capacity'],
      min: [10, 'Capacity must be at least 10'],
      default: 60
    },
    roomType: {
      type: String,
      enum: ['LectureHall', 'ComputerLab', 'ElectronicsLab', 'HardwareLab', 'SeminarHall', 'TutorialRoom'],
      default: 'LectureHall'
    },
    equipmentTags: [
      {
        type: String,
        trim: true
      }
    ],
    departmentId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Department',
      required: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

RoomSchema.index({ departmentId: 1, roomNumber: 1 });

module.exports = mongoose.model('Room', RoomSchema);
