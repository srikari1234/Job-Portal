const ROLES = Object.freeze({
  JOB_SEEKER: 'jobseeker',
  EMPLOYER: 'employer',
  ADMIN: 'admin',
});

const REGISTERABLE_ROLES = Object.freeze([ROLES.JOB_SEEKER, ROLES.EMPLOYER]);

const EMPLOYMENT_TYPES = Object.freeze([
  'full-time',
  'part-time',
  'contract',
  'internship',
  'freelance',
]);

const JOB_STATUS = Object.freeze({
  OPEN: 'open',
  CLOSED: 'closed',
});

const APPLICATION_STATUS = Object.freeze({
  APPLIED: 'applied',
  UNDER_REVIEW: 'under_review',
  SHORTLISTED: 'shortlisted',
  REJECTED: 'rejected',
  HIRED: 'hired',
});

module.exports = {
  ROLES,
  REGISTERABLE_ROLES,
  EMPLOYMENT_TYPES,
  JOB_STATUS,
  APPLICATION_STATUS,
};
