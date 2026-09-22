const { Joi, pagination } = require('./common');
const { ROLES, JOB_STATUS, APPLICATION_STATUS } = require('../constants');

const updateUserStatusSchema = Joi.object({
  isActive: Joi.boolean().required(),
});

const listUsersQuery = Joi.object({
  ...pagination,
  role: Joi.string().valid(...Object.values(ROLES)),
  isActive: Joi.boolean(),
  search: Joi.string().trim().max(100),
});

const adminJobsQuery = Joi.object({
  ...pagination,
  status: Joi.string().valid(...Object.values(JOB_STATUS)),
  search: Joi.string().trim().max(100),
});

const adminApplicationsQuery = Joi.object({
  ...pagination,
  status: Joi.string().valid(...Object.values(APPLICATION_STATUS)),
});

module.exports = { updateUserStatusSchema, listUsersQuery, adminJobsQuery, adminApplicationsQuery };
