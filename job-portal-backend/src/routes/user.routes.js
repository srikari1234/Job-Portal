const router = require('express').Router();
const { getProfile, updateProfile } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { updateProfileSchema } = require('../validators/user.validator');

router.use(protect);

router.route('/profile').get(getProfile).put(validate(updateProfileSchema), updateProfile);

module.exports = router;
