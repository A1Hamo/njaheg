// src/routes/auth.js
const r = require('express').Router();
const passport = require('passport');
const c = require('../controllers/authController');
const { isGoogleAuthEnabled } = require('../config/passport');
const { authLimiter } = require('../middleware/rateLimiter');
const { authenticate } = require('../middleware/auth');
r.post('/register',        authLimiter, c.register);
r.post('/guest',           c.guestRegister);
r.post('/login',           authLimiter, c.login);
r.post('/refresh',         c.refreshToken);
r.post('/logout',          authenticate, c.logout);
r.get ('/verify/:token',   c.verifyEmail);
r.post('/forgot-password', authLimiter, c.forgotPassword);
r.post('/reset-password',  authLimiter, c.resetPassword);
r.get ('/me',              authenticate, c.getMe);

if (isGoogleAuthEnabled()) {
  r.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
  r.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }), c.googleCallback);
} else {
  r.get('/google', (_req, res) => res.status(503).json({ error: 'Google auth not configured' }));
  r.get('/google/callback', (_req, res) => res.status(503).json({ error: 'Google auth not configured' }));
}

module.exports = r;
