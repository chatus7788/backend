const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

module.exports = (passport) => {
  console.log("passport hit: ");

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("Google profile received:", profile);
          const email = profile.emails[0].value;

          let user = await User.findOne({ email });
          if (!user) {
            user = await User.create({
              email,
              googleId: profile.id,
              isActivated: true,
              phone: "0000000000", // Optional: dummy phone or require later
            });
          }
          return done(null, user);
        } catch (err) {
          done(err, null);
        }
      }
    )
  );
  console.log("after 1st");

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};
