import rateLimit from 'express-rate-limit';

/**
 * 1. Global Auth Endpoint Limiter
 * Restricts overall request flooding to all authentication routes (/api/auth/*)
 */
export const globalAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many authentication requests from this IP address. Please try again after 15 minutes.'
  }
});

/**
 * 2. Login Endpoint Rate Limiter
 * Protects login endpoint (/api/auth/login) against credential brute-forcing
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 5, // Limit each IP to 5 login attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP address. Please wait 15 minutes before trying again.'
  }
});

/**
 * 3. OTP Rate Limiter
 * Protects OTP generation and verification (/api/auth/send-otp, /api/auth/verify-otp)
 * against SMS/Email spamming and OTP brute-forcing
 */
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes window
  max: 5, // Limit each IP to 5 OTP requests per 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests from this IP address. Please wait 10 minutes before requesting a new OTP.'
  }
});
