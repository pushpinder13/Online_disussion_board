// const passport = require('passport');
// const JwtStrategy = require('passport-jwt').Strategy;
// const ExtractJwt = require('passport-jwt').ExtractJwt;
// const LocalStrategy = require('passport-local').Strategy;
// const User = require('../models/User');

// // JWT Strategy
// const jwtOptions = {
//   jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//   secretOrKey: process.env.JWT_SECRET || 'your-secret-key'
// };

// passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
//   try {
//     const user = await User.findById(payload.id);
//     if (user) {
//       return done(null, user);
//     }
//     return done(null, false);
//   } catch (error) {
//     return done(error, false);
//   }
// }));

// // Local Strategy
// passport.use(new LocalStrategy({
//   usernameField: 'email'
// }, async (email, password, done) => {
//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return done(null, false, { message: 'User not found' });
//     }

//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) {
//       return done(null, false, { message: 'Invalid credentials' });
//     }

//     return done(null, user);
//   } catch (error) {
//     return done(error);
//   }
// }));

const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const User = require("../models/User");

const cookieExtractor = (req) => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies.token;
  }
  return token;
};

module.exports = function (passport) {
  const opts = {};
  opts.jwtFromRequest = ExtractJwt.fromExtractors([
    cookieExtractor,
    ExtractJwt.fromAuthHeaderAsBearerToken(),
  ]);
  opts.secretOrKey = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY;

  passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
      try {
        const id = jwt_payload.id || jwt_payload.userId;
        const user = await User.findById(id).select('-password');
        if (user) {
          return done(null, user);
        }
        return done(null, false);
      } catch (err) {
        return done(err, false);
      }
    })
  );
};
