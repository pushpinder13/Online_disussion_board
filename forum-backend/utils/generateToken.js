const jwt = require('jsonwebtoken');

const resolveSecret = () => process.env.JWT_SECRET || process.env.JWT_SECRET_KEY;

const generateToken = (userId, res) => {
  const token = jwt.sign(
    { userId },
    resolveSecret(),
    { expiresIn: '7d' }
  );

  if (res && typeof res.cookie === 'function') {
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
  }

  return token;
};

module.exports = generateToken;


