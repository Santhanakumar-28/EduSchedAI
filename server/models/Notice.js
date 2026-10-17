const mongoose = require('mongoose');

const NoticeSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.Mixed,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      default: 'General'
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    content: {
      type: String,
      required: true
    },
    postedBy: {
      type: String,
      default: 'Department Office'
    },
    targetAudience: {
      type: String,
      enum: ['All', 'Faculty', 'Students', 'ClassStudents'],
      default: 'All'
    },
    targetBatchId: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    departmentId: {
      type: mongoose.Schema.Types.Mixed,
      default: 'dept_cse_01'
    },
    date: {
      type: String,
      default: () => new Date().toISOString().split('T')[0]
    },
    pinned: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

NoticeSchema.index({ departmentId: 1, targetAudience: 1, targetBatchId: 1 });

module.exports = mongoose.model('Notice', NoticeSchema);
