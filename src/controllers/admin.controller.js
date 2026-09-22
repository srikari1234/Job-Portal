const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { escapeRegex, getPagination, paginationMeta } = require('../utils/helpers');
const { ROLES } = require('../constants');

async function getActivitySummary(user) {
  if (user.role === ROLES.EMPLOYER) {
    return { jobsPosted: await Job.countDocuments({ employer: user._id }) };
  }
  if (user.role === ROLES.JOB_SEEKER) {
    return { applicationsSubmitted: await Application.countDocuments({ applicant: user._id }) };
  }
  return {};
}

async function removeUserData(user) {
  if (user.role === ROLES.EMPLOYER) {
    const jobIds = await Job.find({ employer: user._id }).distinct('_id');
    await Application.deleteMany({ job: { $in: jobIds } });
    await Job.deleteMany({ employer: user._id });
  } else if (user.role === ROLES.JOB_SEEKER) {
    await Application.deleteMany({ applicant: user._id });
  }
}

exports.getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { role, isActive, search } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: users.length,
    pagination: paginationMeta(total, page, limit),
    data: { users },
  });
});

exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  const activity = await getActivitySummary(user);

  res.status(200).json({ success: true, data: { user, activity } });
});

exports.updateUserStatus = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot change the status of your own account');
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  user.isActive = req.body.isActive;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    data: { user },
  });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot delete your own account');
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  await removeUserData(user);
  await user.deleteOne();

  res.status(200).json({ success: true, message: 'User and related data deleted successfully' });
});

exports.getJobs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status, search } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: rx }, { companyName: rx }];
  }

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .sort({ postedDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('employer', 'name email companyName'),
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
  const job = await Job.findById(req.params.id).populate('employer', 'name email companyName');
  if (!job) throw new ApiError(404, 'Job not found');

  const applicationsCount = await Application.countDocuments({ job: job._id });

  res.status(200).json({ success: true, data: { job, applicationsCount } });
});

exports.deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, 'Job not found');

  await Application.deleteMany({ job: job._id });
  await job.deleteOne();

  res.status(200).json({ success: true, message: 'Job removed successfully' });
});

exports.getApplications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('job', 'title companyName status')
      .populate('applicant', 'name email'),
    Application.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: applications.length,
    pagination: paginationMeta(total, page, limit),
    data: { applications },
  });
});

exports.getStats = asyncHandler(async (req, res) => {
  const countBy = (Model, field) =>
    Model.aggregate([{ $group: { _id: `$${field}`, count: { $sum: 1 } } }]);

  const toMap = (rows) => Object.fromEntries(rows.map((row) => [row._id, row.count]));

  const [usersByRole, jobsByStatus, applicationsByStatus, totalUsers, totalJobs, totalApplications] =
    await Promise.all([
      countBy(User, 'role'),
      countBy(Job, 'status'),
      countBy(Application, 'status'),
      User.countDocuments(),
      Job.countDocuments(),
      Application.countDocuments(),
    ]);

  res.status(200).json({
    success: true,
    data: {
      totals: { users: totalUsers, jobs: totalJobs, applications: totalApplications },
      usersByRole: toMap(usersByRole),
      jobsByStatus: toMap(jobsByStatus),
      applicationsByStatus: toMap(applicationsByStatus),
    },
  });
});
