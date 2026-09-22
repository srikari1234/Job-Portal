const router = require('express').Router();
const job = require('../controllers/job.controller');
const application = require('../controllers/application.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { validate, validateObjectId } = require('../middleware/validate');
const {
  createJobSchema,
  updateJobSchema,
  listJobsQuery,
  myJobsQuery,
} = require('../validators/job.validator');
const { applySchema, listApplicationsQuery } = require('../validators/application.validator');
const { ROLES } = require('../constants');

const { EMPLOYER, JOB_SEEKER } = ROLES;

router.get('/', validate(listJobsQuery, 'query'), job.getJobs);

router.get('/my', protect, authorize(EMPLOYER), validate(myJobsQuery, 'query'), job.getMyJobs);
router.post('/', protect, authorize(EMPLOYER), validate(createJobSchema), job.createJob);

router.get('/:id', validateObjectId('id'), job.getJobById);

router.put(
  '/:id',
  protect,
  authorize(EMPLOYER),
  validateObjectId('id'),
  validate(updateJobSchema),
  job.updateJob
);

router.delete('/:id', protect, authorize(EMPLOYER), validateObjectId('id'), job.deleteJob);

router.get(
  '/:id/applications',
  protect,
  authorize(EMPLOYER),
  validateObjectId('id'),
  validate(listApplicationsQuery, 'query'),
  application.getJobApplications
);

router.post(
  '/:id/apply',
  protect,
  authorize(JOB_SEEKER),
  validateObjectId('id'),
  validate(applySchema),
  application.applyToJob
);

module.exports = router;
