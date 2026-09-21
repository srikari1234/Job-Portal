const Job = require('../models/Job');
const Application = require('../models/Application');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { escapeRegex, getPagination, paginationMeta } = require('../utils/helpers');
const { JOB_STATUS } = require('../constants');

const SORTS = {
  newest: { postedDate: -1, _id: -1 },
  oldest: { postedDate: 1, _id: 1 },
  salary: { 'salaryRange.max': -1, _id: -1 },
};

async function findOwnedJob(jobId, user) {
  const job = await Job.findById(jobId);
  if (!job) throw new ApiError(404, 'Job not found');
  if (!job.employer.equals(user._id)) {
    throw new ApiError(403, 'You can only manage your own job postings');
  }
  return job;
}

exports.createJob = asyncHandler(async (req, res) => {
  const job = await Job.create({ ...req.body, employer: req.user._id });
  res.status(201).json({ success: true, message: 'Job created successfully', data: { job } });
});

exports.getJobs = asyncHandler(async (req, res) => {
  const { search, location, employmentType, skills, minSalary, sort } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = { status: JOB_STATUS.OPEN, applicationDeadline: { $gt: new Date() } };

  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: rx }, { companyName: rx }, { description: rx }];
  }
  if (location) {
    filter.location = new RegExp(escapeRegex(location), 'i');
  }
  if (employmentType) {
    filter.employmentType = employmentType;
  }
  if (skills) {
    const list = skills
      .split(',')
      .map((skill) => skill.trim().toLowerCase())
      .filter(Boolean);
    if (list.length) filter.requiredSkills = { $in: list };
  }
  if (minSalary !== undefined) {
    filter['salaryRange.max'] = { $gte: Number(minSalary) };
  }

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .sort(SORTS[sort || 'newest'])
      .skip(skip)
      .limit(limit)
      .populate('employer', 'name companyName'),
    Job.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: jobs.length,
    pagination: paginationMeta(total, page, limit),
    data: { jobs },
  });
});

exports.getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate('employer', 'name companyName');
  if (!job) throw new ApiError(404, 'Job not found');
  res.status(200).json({ success: true, data: { job } });
});

exports.getMyJobs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const filter = { employer: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const [jobs, total] = await Promise.all([
    Job.find(filter).sort({ postedDate: -1 }).skip(skip).limit(limit),
    Job.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: jobs.length,
    pagination: paginationMeta(total, page, limit),
    data: { jobs },
  });
});

exports.updateJob = asyncHandler(async (req, res) => {
  const job = await findOwnedJob(req.params.id, req.user);

  job.set(req.body);
  await job.save();

  res.status(200).json({ success: true, message: 'Job updated successfully', data: { job } });
});

exports.deleteJob = asyncHandler(async (req, res) => {
  const job = await findOwnedJob(req.params.id, req.user);

  await Application.deleteMany({ job: job._id });
  await job.deleteOne();

  res.status(200).json({ success: true, message: 'Job and its applications deleted successfully' });
});

exports.findOwnedJob = findOwnedJob;
