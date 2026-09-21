const router = require('express').Router();
const admin = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { validate, validateObjectId } = require('../middleware/validate');
const {
  updateUserStatusSchema,
  listUsersQuery,
  adminJobsQuery,
  adminApplicationsQuery,
} = require('../validators/admin.validator');
const { ROLES } = require('../constants');

router.use(protect, authorize(ROLES.ADMIN));

router.get('/users', validate(listUsersQuery, 'query'), admin.getUsers);
router.get('/users/:id', validateObjectId('id'), admin.getUserById);
router.patch(
  '/users/:id/status',
  validateObjectId('id'),
  validate(updateUserStatusSchema),
  admin.updateUserStatus
);
router.delete('/users/:id', validateObjectId('id'), admin.deleteUser);

router.get('/jobs', validate(adminJobsQuery, 'query'), admin.getJobs);
router.get('/jobs/:id', validateObjectId('id'), admin.getJobById);
router.delete('/jobs/:id', validateObjectId('id'), admin.deleteJob);

router.get('/applications', validate(adminApplicationsQuery, 'query'), admin.getApplications);
router.get('/stats', admin.getStats);

module.exports = router;
