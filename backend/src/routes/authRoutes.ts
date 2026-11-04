import { Router } from 'express';
import { register, login, logout, googleAuth, forgotPassword, resetPasswordWithSecurity, sendOTP, verifyOTP, getSecurityQuestion } from '../controllers/authController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();



// Auth endpoints with specific rate limiters
router.post('/login', login);
router.post('/logout', (req, res, next) => {
  // Optional JWT middleware: attach user if header present, but don't block request if missing
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticateJWT(req as any, res, next);
  }
  next();
}, logout);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

// Other auth endpoints
router.post('/register', register);
router.post('/google', googleAuth);
router.post('/google-signup', googleAuth);
router.post('/security-question', getSecurityQuestion);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPasswordWithSecurity);
router.post('/reset-password-security', resetPasswordWithSecurity);

export default router;
