const { Joi, pagination, skillsArray } = require('./common');
const { EMPLOYMENT_TYPES, JOB_STATUS } = require('../constants');

const salaryRange = Joi.object({
  min: Joi.number().min(0).required(),
  max: Joi.number().min(Joi.ref('min')).required(),
  currency: Joi.string().trim().uppercase().length(3).default('INR'),
});

const experienceRequired = Joi.object({
  min: Joi.number().integer().min(0).max(60).default(0),
  max: Joi.number().integer().min(Joi.ref('min')).max(60),
});

const deadline = Joi.date().iso().greater('now').messages({
  'date.greater': 'Application deadline must be in the future',
});

const createJobSchema = Joi.object({
  title: Joi.string().trim().min(3).max(120).required(),
  companyName: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().min(20).max(5000).required(),
  location: Joi.string().trim().min(2).max(100).required(),
  employmentType: Joi.string()
    .valid(...EMPLOYMENT_TYPES)
    .required(),
  salaryRange,
  requiredSkills: skillsArray(30).min(1).required(),
  experienceRequired,
  applicationDeadline: deadline.required(),
  status: Joi.string().valid(...Object.values(JOB_STATUS)),
});

const updateJobSchema = Joi.object({
  title: Joi.string().trim().min(3).max(120),
  companyName: Joi.string().trim().min(2).max(100),
  description: Joi.string().trim().min(20).max(5000),
  location: Joi.string().trim().min(2).max(100),
  employmentType: Joi.string().valid(...EMPLOYMENT_TYPES),
  salaryRange,
  requiredSkills: skillsArray(30).min(1),
  experienceRequired,
  applicationDeadline: deadline,
  status: Joi.string().valid(...Object.values(JOB_STATUS)),
}).min(1);

const listJobsQuery = Joi.object({
  ...pagination,
  search: Joi.string().trim().max(100),
  location: Joi.string().trim().max(100),
  employmentType: Joi.string().valid(...EMPLOYMENT_TYPES),
  skills: Joi.string().trim().max(200),
  minSalary: Joi.number().min(0),
  sort: Joi.string().valid('newest', 'oldest', 'salary').default('newest'),
});

const myJobsQuery = Joi.object({
  ...pagination,
  status: Joi.string().valid(...Object.values(JOB_STATUS)),
});

module.exports = { createJobSchema, updateJobSchema, listJobsQuery, myJobsQuery };
