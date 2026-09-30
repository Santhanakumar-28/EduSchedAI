const mongoose = require('mongoose');

const SlotPreferenceSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true
    },
    period: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    weight: {
      type: Number,
      default: 1 // 1: Preferred, -1: Disfavored
    },
    reason: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const UnavailableSlotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true
    },
    period: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    reason: {
      type: String,
      default: 'Pre-scheduled administrative / research commitment'
    }
  },
  { _id: false }
);

const FacultySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide faculty name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please provide faculty email'],
      unique: true,
      lowercase: true,
      trim: true
    },
    employeeCode: {
      type: String,
      required: [true, 'Please provide employee code'],
      unique: true,
      uppercase: true,
      trim: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    cadre: {
      type: String,
      enum: ['Professor', 'AssociateProf', 'AssistantProf', 'VisitingFaculty'],
      default: 'AssistantProf'
    },
    targetHours: {
      type: Number,
      required: true,
      default: 16 // Standard weekly target
    },
    maxDailyHours: {
      type: Number,
      default: 4
    },
    specializations: [
      {
        type: String,
        trim: true
      }
    ],
    unavailableSlots: [UnavailableSlotSchema],
    preferredSlots: [SlotPreferenceSchema],
    currentAssignedHours: {
      type: Number,
      default: 0
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

// Auto-set target hours based on Cadre if not explicitly provided
FacultySchema.pre('save', function (next) {
  if (this.isModified('cadre') && !this.isModified('targetHours')) {
    if (this.cadre === 'Professor') this.targetHours = 14;
    else if (this.cadre === 'AssociateProf') this.targetHours = 16;
    else if (this.cadre === 'AssistantProf') this.targetHours = 18;
    else if (this.cadre === 'VisitingFaculty') this.targetHours = 8;
  }
  next();
});

FacultySchema.index({ departmentId: 1, employeeCode: 1 }, { unique: true });
FacultySchema.index({ departmentId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Faculty', FacultySchema);
