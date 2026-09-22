const router = require('express').Router();
const application = require('../controllers/application.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { validate, validateObjectId } = require('../middleware/validate');
const { updateStatusSchema, listApplicationsQuery } = require('../validators/application.validator');
const { ROLES } = require('../constants');

router.use(protect);

router.get(
  '/my',
  authorize(ROLES.JOB_SEEKER),
  validate(listApplicationsQuery, 'query'),
  application.getMyApplications
);

router.get('/:id', validateObjectId('id'), application.getApplicationById);

router.patch(
  '/:id/status',
  authorize(ROLES.EMPLOYER),
  validateObjectId('id'),
  validate(updateStatusSchema),
  application.updateApplicationStatus
);

module.exports = router;
