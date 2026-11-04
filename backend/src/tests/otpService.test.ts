import { sendGmailCode, generateOTP, maskEmail, sendMobileOTP, isEmailConfigured } from '../utils/otpService';

describe('OTP & Mobile Service Backend Unit Tests', () => {
  it('should generate a 6-digit numeric OTP string', () => {
    const otp = generateOTP();
    expect(otp).toMatch(/^\d{6}$/);
  });

  it('should mask email address safely', () => {
    const masked = maskEmail('rehanchaudhari181133@gmail.com');
    expect(masked).toBe('reh***33@gmail.com');
  });

  it('should report email verification as disabled', () => {
    expect(isEmailConfigured()).toBe(false);
  });

  it('should dispatch mobile OTP successfully', async () => {
    const res = await sendMobileOTP('9876543210', '123456');
    expect(res).toBe(true);
  });

  it('should return disabled status for sendGmailCode', async () => {
    const result = await sendGmailCode('user@gmail.com', '123456', 'Driver');
    expect(result.success).toBe(false);
    expect(result.message).toContain('Email verification is temporarily disabled');
  });
});
