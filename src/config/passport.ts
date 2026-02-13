import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { config } from './index';

// Configure Google OAuth Strategy
if (config.googleClientId && config.googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.googleClientId,
        clientSecret: config.googleClientSecret,
        callbackURL: config.googleCallbackUrl,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Extract user info from Google profile
          // Note: We use 'id' here, but it will be converted to userId in the callback
          const googleUser = {
            userId: profile.id, // Use userId to match our JWT payload
            id: profile.id,
            email: profile.emails?.[0]?.value || '',
            displayName: profile.displayName,
            picture: profile.photos?.[0]?.value,
          };

          return done(null, googleUser);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
}

export default passport;

