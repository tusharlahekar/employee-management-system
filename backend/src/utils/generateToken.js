const jwt = require('jsonwebtoken');

const generateToken = (employee) => {
  return jwt.sign(
    { id: employee._id, role: employee.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

const cookieOptions = () => {
  const days = parseInt(process.env.JWT_COOKIE_EXPIRES_DAYS || '1', 10);
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
  };
};

module.exports = { generateToken, cookieOptions };
