const mongoose = require('mongoose');
const { EMPLOYMENT_TYPES, JOB_STATUS } = require('../constants');

const { Schema } = mongoose;

const salaryRangeSchema = new Schema(
  {
    min: {
      type: Number,
      required: [true, 'Minimum salary is required'],
      min: [0, 'Salary cannot be negative'],
    },
    max: {
      type: Number,
      required: [true, 'Maximum salary is required'],
      min: [0, 'Salary cannot be negative'],
      validate: {
        validator: function (value) {
          return this.min == null || value >= this.min;
        },
        message: 'Maximum salary must be greater than or equal to minimum salary',
      },
    },
    currency: {
      type: String,
      uppercase: true,
      trim: true,
      default: 'INR',
      minlength: 3,
      maxlength: 3,
    },
  },
  { _id: false }
);

const experienceRequiredSchema = new Schema(
  {
    min: { type: Number, min: 0, default: 0 },
    max: {
      type: Number,
      min: 0,
      validate: {
        validator: function (value) {
          return value == null || this.min == null || value >= this.min;
        },
        message: 'Maximum experience must be greater than or equal to minimum experience',
      },
    },
  },
  { _id: false }
);

const jobSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      minlength: [3, 'Job title must be at least 3 characters'],
      maxlength: [120, 'Job title cannot exceed 120 characters'],
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: 100,
    },
    employmentType: {
      type: String,
      required: [true, 'Employment type is required'],
      enum: { values: EMPLOYMENT_TYPES, message: 'Invalid employment type: {VALUE}' },
    },
    salaryRange: { type: salaryRangeSchema },
    requiredSkills: {
      type: [String],
      set: (skills) =>
        Array.isArray(skills)
          ? [...new Set(skills.map((skill) => String(skill).trim().toLowerCase()).filter(Boolean))]
          : skills,
      default: [],
    },
    experienceRequired: { type: experienceRequiredSchema },
    postedDate: { type: Date, default: Date.now },
    applicationDeadline: { type: Date, required: [true, 'Application deadline is required'] },
    status: {
      type: String,
      enum: { values: Object.values(JOB_STATUS), message: 'Invalid job status: {VALUE}' },
      default: JOB_STATUS.OPEN,
    },
    employer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

jobSchema.index({ status: 1, applicationDeadline: 1, postedDate: -1 });
jobSchema.index({ employmentType: 1 });
jobSchema.index({ requiredSkills: 1 });

jobSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Job', jobSchema);
