const asyncHandler = require('../utils/asyncHandler');

exports.getProfile = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user } });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  req.user.set(req.body);
  await req.user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: req.user },
  });
});
