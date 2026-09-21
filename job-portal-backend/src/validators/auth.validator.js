const { Joi } = require('./common');
const { REGISTERABLE_ROLES } = require('../constants');

const email = Joi.string().trim().lowercase().email({ tlds: { allow: false } });

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  email: email.required(),
  password: Joi.string()
    .min(8)
    .max(72)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .required()
    .messages({
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter and one number',
    }),
  role: Joi.string()
    .valid(...REGISTERABLE_ROLES)
    .required()
    .messages({ 'any.only': `Role must be one of: ${REGISTERABLE_ROLES.join(', ')}` }),
  companyName: Joi.string().trim().max(100),
});

const loginSchema = Joi.object({
  email: email.required(),
  password: Joi.string().max(72).required(),
});

module.exports = { registerSchema, loginSchema };
