const ApiError = require('../utils/ApiError');

const authorize =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required. Please log in.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access denied. Role '${req.user.role}' is not allowed to perform this action.`
        )
      );
    }

    next();
  };

module.exports = { authorize };
