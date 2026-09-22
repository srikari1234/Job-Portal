const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../constants');

const { Schema } = mongoose;

const normalizeSkills = (skills) =>
  Array.isArray(skills)
    ? [...new Set(skills.map((skill) => String(skill).trim().toLowerCase()).filter(Boolean))]
    : skills;

const experienceSchema = new Schema({
  jobTitle: { type: String, required: [true, 'Job title is required'], trim: true, maxlength: 100 },
  company: { type: String, required: [true, 'Company is required'], trim: true, maxlength: 100 },
  startDate: { type: Date, required: [true, 'Start date is required'] },
  endDate: { type: Date, default: null },
  currentlyWorking: { type: Boolean, default: false },
  description: { type: String, trim: true, maxlength: 1000 },
});

const educationSchema = new Schema({
  degree: { type: String, required: [true, 'Degree is required'], trim: true, maxlength: 100 },
  institution: {
    type: String,
    required: [true, 'Institution is required'],
    trim: true,
    maxlength: 150,
  },
  fieldOfStudy: { type: String, trim: true, maxlength: 100 },
  startYear: { type: Number, min: 1950 },
  endYear: { type: Number, min: 1950 },
});

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: { values: Object.values(ROLES), message: 'Invalid role: {VALUE}' },
      default: ROLES.JOB_SEEKER,
    },
    isActive: { type: Boolean, default: true },
    phone: { type: String, trim: true },
    headline: { type: String, trim: true, maxlength: 150 },
    location: { type: String, trim: true, maxlength: 100 },
    companyName: { type: String, trim: true, maxlength: 100 },
    skills: { type: [String], set: normalizeSkills, default: [] },
    experience: { type: [experienceSchema], default: [] },
    education: { type: [educationSchema], default: [] },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, isActive: 1 });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
