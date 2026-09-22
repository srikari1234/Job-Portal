const { Joi, pagination } = require('./common');
const { APPLICATION_STATUS } = require('../constants');

const applySchema = Joi.object({
  coverLetter: Joi.string().trim().max(3000).allow(''),
  resumeUrl: Joi.string()
    .trim()
    .uri({ scheme: ['http', 'https'] })
    .max(500),
  expectedSalary: Joi.number().min(0),
});

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(APPLICATION_STATUS))
    .required(),
  note: Joi.string().trim().max(500).allow(''),
});

const listApplicationsQuery = Joi.object({
  ...pagination,
  status: Joi.string().valid(...Object.values(APPLICATION_STATUS)),
});

module.exports = { applySchema, updateStatusSchema, listApplicationsQuery };
