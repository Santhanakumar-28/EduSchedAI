const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema(
  {
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
      type: mongoose.Schema.Types.ObjectId,
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
