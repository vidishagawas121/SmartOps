/*
 * TEMPORARILY DISABLED: Gmail / Nodemailer Email Verification Service
 * To re-enable:
 * 1. Uncomment import nodemailer from 'nodemailer';
 * 2. Restore createSMTPTransporter and sendGmailCode Nodemailer logic below.
 */

// import nodemailer from 'nodemailer';

/**
 * Interface for OTP delivery response
 */
export interface OTPDeliveryResult {
  success: boolean;
  message: string;
  messageId?: string;
  isDevBypass?: boolean;
}

/**
 * Safely masks recipient email for secure logging (e.g. "rehanchaudhari181133@gmail.com" -> "reh***33@gmail.com")
 */
export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return '***@***.com';
  const [local, domain] = email.split('@');
  if (local.length <= 3) {
    return `${local[0]}***@${domain}`;
  }
  return `${local.slice(0, 3)}***${local.slice(-2)}@${domain}`;
};

/**
 * TEMPORARILY DISABLED: Validates whether required email environment variables are configured
 */
export const isEmailConfigured = (): boolean => {
  /*
  // TEMPORARILY DISABLED EMAIL CONFIGURATION CHECK
  const user = (process.env.EMAIL_USER || process.env.SMTP_USER || process.env.GMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || process.env.GMAIL_PASS || '').trim();

  if (!user || !pass || user.includes('your_gmail') || user.includes('your-sender') || user.includes('example.com')) {
    return false;
  }
  return true;
  */
  return false;
};

/**
 * TEMPORARILY DISABLED: Transporter setup for Nodemailer Gmail SMTP
 */
/*
const createSMTPTransporter = () => {
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.EMAIL_PORT || process.env.SMTP_PORT) || 465;
  const secureEnv = process.env.EMAIL_SECURE || process.env.SMTP_SECURE;
  const secure = secureEnv !== undefined ? secureEnv === 'true' : port === 465;

  const user = (process.env.EMAIL_USER || process.env.SMTP_USER || process.env.GMAIL_USER || '').trim();
  const rawPass = process.env.EMAIL_PASS || process.env.SMTP_PASS || process.env.GMAIL_PASS || '';
  const pass = rawPass.replace(/\s+/g, '').trim();

  const isGmailHost = host.toLowerCase().includes('gmail');

  const transporterOptions: any = isGmailHost
    ? {
        service: 'gmail',
        auth: { user, pass },
        tls: { rejectUnauthorized: false }
      }
    : {
        host,
        port,
        secure,
        auth: { user, pass },
        tls: { rejectUnauthorized: false }
      };

  return {
    host,
    port,
    secure,
    user,
    pass,
    transporter: nodemailer.createTransport(transporterOptions)
  };
};
*/

/**
 * TEMPORARILY DISABLED: Validates email configuration at startup
 */
export const validateEmailEnvironment = (): boolean => {
  console.log('[EMAIL] ℹ️ Email/Gmail verification service is temporarily disabled.');
  return false;
};

/**
 * TEMPORARILY DISABLED: Verifies SMTP connection
 */
export const verifySMTPConnection = async (): Promise<boolean> => {
  console.log('[EMAIL] ℹ️ SMTP/Gmail connection check is temporarily disabled.');
  return false;
};

/**
 * Generates a secure 6-digit numeric OTP code
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Dispatches Mobile SMS OTP Code to the Driver or Owner
 */
export const sendMobileOTP = async (mobileNumber: string, otpCode: string): Promise<boolean> => {
  console.log(`[SMS OTP SERVICE] 📱 Dispatching 6-Digit Mobile OTP [${otpCode}] to ${mobileNumber.slice(-4).padStart(mobileNumber.length, '*')}`);
  return true;
};

/**
 * TEMPORARILY DISABLED: Dispatches Gmail / Email Verification Code
 */
export const sendGmailCode = async (_email: string, _otpCode: string, _role: string): Promise<OTPDeliveryResult> => {
  console.log('[EMAIL] ℹ️ sendGmailCode call ignored - Email/Gmail verification is temporarily disabled.');
  /*
  // TEMPORARILY DISABLED GMAIL SENDMAIL IMPLEMENTATION
  const maskedTarget = maskEmail(_email);
  const { user, transporter } = createSMTPTransporter();
  ...
  */
  return {
    success: false,
    message: 'Email verification is temporarily disabled.'
  };
};
