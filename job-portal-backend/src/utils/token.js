const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'token';

function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  };
}

function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
}

function sendTokenResponse(res, user, statusCode, message) {
  const token = generateToken(user._id);
  const days = Number(process.env.COOKIE_EXPIRES_DAYS) || 1;

  res.cookie(COOKIE_NAME, token, {
    ...baseCookieOptions(),
    maxAge: days * 24 * 60 * 60 * 1000,
  });

  return res.status(statusCode).json({
    success: true,
    message,
    data: { user },
  });
}

function clearTokenCookie(res) {
  res.clearCookie(COOKIE_NAME, baseCookieOptions());
}

module.exports = { COOKIE_NAME, generateToken, sendTokenResponse, clearTokenCookie };
