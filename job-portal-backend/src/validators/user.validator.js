const { Joi, currentYear, skillsArray } = require('./common');

const experienceItem = Joi.object({
  jobTitle: Joi.string().trim().max(100).required(),
  company: Joi.string().trim().max(100).required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).allow(null),
  currentlyWorking: Joi.boolean(),
  description: Joi.string().trim().max(1000).allow(''),
});

const educationItem = Joi.object({
  degree: Joi.string().trim().max(100).required(),
  institution: Joi.string().trim().max(150).required(),
  fieldOfStudy: Joi.string().trim().max(100).allow(''),
  startYear: Joi.number().integer().min(1950).max(currentYear + 10),
  endYear: Joi.number().integer().min(Joi.ref('startYear')).max(currentYear + 10),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50),
  phone: Joi.string()
    .trim()
    .pattern(/^\+?[\d\s-]{7,15}$/)
    .messages({ 'string.pattern.base': 'Phone must be 7-15 digits and may start with +' }),
  headline: Joi.string().trim().max(150).allow(''),
  location: Joi.string().trim().max(100).allow(''),
  companyName: Joi.string().trim().max(100).allow(''),
  skills: skillsArray(30),
  experience: Joi.array().items(experienceItem).max(30),
  education: Joi.array().items(educationItem).max(10),
}).min(1);

module.exports = { updateProfileSchema };
