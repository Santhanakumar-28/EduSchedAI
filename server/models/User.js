const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.Mixed,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      lowercase: true,
      trim: true
    },
    username: {
      type: String,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Please provide a password']
    },
    role: {
      type: String,
      enum: ['Admin', 'HOD', 'Faculty', 'Student'],
      default: 'Faculty'
    },
    departmentId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Department',
      default: null
    },
    facultyRef: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Faculty',
      default: null
    },
    facultyId: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    cadre: {
      type: String,
      default: null
    },
    isClassCoordinator: {
      type: Boolean,
      default: false
    },
    coordinatedBatchId: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    rollNo: {
      type: String,
      default: null
    },
    batchId: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    addedByFacultyId: {
      type: mongoose.Schema.Types.Mixed,
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

// Match user entered password to hashed or stored password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  if (this.password === enteredPassword) return true;
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (e) {
    return false;
  }
};

module.exports = mongoose.model('User', UserSchema);
