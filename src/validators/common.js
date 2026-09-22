const Joi = require('joi');

const currentYear = new Date().getFullYear();

const pagination = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
};

const skillsArray = (max = 30) =>
  Joi.array().items(Joi.string().trim().lowercase().min(1).max(40)).max(max);

module.exports = { Joi, currentYear, pagination, skillsArray };
