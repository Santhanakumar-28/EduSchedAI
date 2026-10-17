const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.Mixed,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    code: {
      type: String,
      required: [true, 'Please provide a department code (e.g. CSE)'],
      unique: true,
      uppercase: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Please provide department name'],
      trim: true
    },
    institution: {
      type: String,
      required: [true, 'Please provide institution name'],
      default: 'University Institute of Engineering & Technology'
    },
    hodRef: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Faculty',
      default: null
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

module.exports = mongoose.model('Department', DepartmentSchema);
