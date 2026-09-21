const mongoose = require('mongoose');
const { APPLICATION_STATUS } = require('../constants');

const { Schema } = mongoose;

const statusHistorySchema = new Schema(
  {
    status: { type: String, enum: Object.values(APPLICATION_STATUS), required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    note: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false }
);

const applicationSchema = new Schema(
  {
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    applicant: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    coverLetter: { type: String, trim: true, maxlength: 3000 },
    resumeUrl: { type: String, trim: true, maxlength: 500 },
    expectedSalary: { type: Number, min: 0 },
    status: {
      type: String,
      enum: { values: Object.values(APPLICATION_STATUS), message: 'Invalid status: {VALUE}' },
      default: APPLICATION_STATUS.APPLIED,
    },
    statusHistory: { type: [statusHistorySchema], default: [] },
    appliedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
applicationSchema.index({ applicant: 1, createdAt: -1 });
applicationSchema.index({ job: 1, status: 1 });

applicationSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Application', applicationSchema);
