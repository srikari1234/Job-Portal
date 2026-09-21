const ApiError = require('../utils/ApiError');

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

const validate =
  (schema, property = 'body') =>
  (req, res, next) => {
    const { value, error } = schema.validate(req[property] || {}, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
      }));

      return next(new ApiError(400, 'Validation failed', errors));
    }

    req[property] = value;
    next();
  };

const validateObjectId =
  (...paramNames) =>
  (req, res, next) => {
    for (const name of paramNames) {
      if (!OBJECT_ID.test(req.params[name] || '')) {
        return next(new ApiError(400, `Invalid ${name}: '${req.params[name]}' is not a valid ID`));
      }
    }

    next();
  };

module.exports = { validate, validateObjectId };
