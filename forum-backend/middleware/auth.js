const passport = require('passport');

const requireAuth = passport.authenticate('jwt', { session: false });

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

const requireModerator = (req, res, next) => {
  if (req.user && ['admin', 'moderator'].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: 'Moderator access required' });
  }
};

module.exports = {
  requireAuth,
  requireAdmin,
  requireModerator
};