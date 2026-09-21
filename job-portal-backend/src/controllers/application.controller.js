const Job = require('../models/Job');
const Application = require('../models/Application');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, paginationMeta } = require('../utils/helpers');
const { ROLES, JOB_STATUS, APPLICATION_STATUS } = require('../constants');

const JOB_SUMMARY = 'title companyName location employmentType status applicationDeadline employer';
const APPLICANT_SUMMARY = 'name email phone headline skills experience education';

exports.applyToJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, 'Job not found');

  if (job.status !== JOB_STATUS.OPEN) {
    throw new ApiError(400, 'This job is no longer accepting applications');
  }
  if (job.applicationDeadline <= new Date()) {
    throw new ApiError(400, 'The application deadline for this job has passed');
  }

  const alreadyApplied = await Application.exists({ job: job._id, applicant: req.user._id });
  if (alreadyApplied) {
    throw new ApiError(409, 'You have already applied for this job');
  }

  const { coverLetter, resumeUrl, expectedSalary } = req.body;

  const application = await Application.create({
    job: job._id,
    applicant: req.user._id,
    coverLetter,
    resumeUrl,
    expectedSalary,
    statusHistory: [{ status: APPLICATION_STATUS.APPLIED, changedBy: req.user._id }],
  });

  res.status(201).json({
    success: true,
    message: 'Application submitted successfully',
    data: { application },
  });
});

exports.getMyApplications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const filter = { applicant: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('job', 'title companyName location employmentType status applicationDeadline'),
    Application.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: applications.length,
    pagination: paginationMeta(total, page, limit),
    data: { applications },
  });
});

exports.getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('job', JOB_SUMMARY)
    .populate('applicant', 'name email phone skills experience education');

  if (!application) throw new ApiError(404, 'Application not found');

  const { user } = req;
  const isApplicant = application.applicant._id.equals(user._id);
  const isJobOwner = application.job && application.job.employer.equals(user._id);
  const isAdmin = user.role === ROLES.ADMIN;

  if (!isApplicant && !isJobOwner && !isAdmin) {
    throw new ApiError(403, 'You are not allowed to view this application');
  }

  res.status(200).json({ success: true, data: { application } });
});

exports.getJobApplications = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, 'Job not found');
  if (!job.employer.equals(req.user._id)) {
    throw new ApiError(403, 'You can only view applications for your own jobs');
  }

  const { page, limit, skip } = getPagination(req.query);

  const filter = { job: job._id };
  if (req.query.status) filter.status = req.query.status;

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('applicant', APPLICANT_SUMMARY),
    Application.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: applications.length,
    pagination: paginationMeta(total, page, limit),
    data: { job: { _id: job._id, title: job.title }, applications },
  });
});

exports.updateApplicationStatus = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id).populate('job', 'employer title');
  if (!application) throw new ApiError(404, 'Application not found');

  if (!application.job || !application.job.employer.equals(req.user._id)) {
    throw new ApiError(403, 'You can only update applications for your own jobs');
  }

  const { status, note } = req.body;

  application.status = status;
  application.statusHistory.push({ status, changedBy: req.user._id, note: note || undefined });
  await application.save();

  res.status(200).json({
    success: true,
    message: `Application status updated to '${status}'`,
    data: { application },
  });
});
