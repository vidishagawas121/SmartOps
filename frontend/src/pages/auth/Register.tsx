import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useOperations } from '../../store/OperationsContext';
import { UserRole } from '../../types';
import { motion } from 'framer-motion';
import { api } from '../../api/client';
import {
  Eye,
  EyeOff,
  Truck,
  KeyRound,
  ArrowRight,
  Loader2,
  AlertCircle,
  Activity,
  Package,
  Mail,
  CheckCircle,
  RefreshCw,
  ArrowLeft,
  User as UserIcon,
  Phone,
  Building,
  FileText
} from 'lucide-react';
import { LogoIcon } from '../../components/common/LogoIcon';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';

// ── Design tokens — exact values from SmartOps dashboard & Login page ────────
const DS = {
  bg:             '#F8F9FF',
  card:           '#FFFFFF',
  border:         '#E5EEFF',
  primary:        '#006A6A',
  primaryGrad:    'linear-gradient(135deg, #006A6A 0%, #00A3A3 100%)',
  primaryShadow:  'rgba(0, 106, 106, 0.15)',
  primaryFocus:   'rgba(0, 106, 106, 0.12)',
  surfaceLow:     '#EFF4FF',
  textPrimary:    '#0B1C30',
  textSecondary:  '#545F73',
  textMuted:      '#6D7A79',
  textDisabled:   '#BCC9C8',
  danger:         '#BA1A1A',
  dangerBg:       'rgba(186, 26, 26, 0.08)',
  dangerBorder:   'rgba(186, 26, 26, 0.15)',
  shadowSm:       '0 1px 3px 0 rgba(11,28,48,0.03), 0 1px 2px -1px rgba(11,28,48,0.02)',
  shadowMd:       '0 4px 12px -2px rgba(11,28,48,0.05), 0 2px 6px -2px rgba(11,28,48,0.03)',
  shadowCard:     '0 1px 3px 0 rgba(11,28,48,0.03), 0 4px 12px -4px rgba(11,28,48,0.04)',
  radius:         '18px',
  radiusInput:    '12px',
  radiusBtn:      '12px',
};

// ── Portal options ─────────────────────────────────────────────────────────────
const PORTALS: { role: UserRole; label: string; Icon: React.FC<{ size?: number; strokeWidth?: number }> }[] = [
  { role: 'Owner',  label: 'Owner Registration',  Icon: KeyRound },
  { role: 'Driver', label: 'Driver Registration', Icon: Truck },
];

// ── Features bullets ──────────────────────────────────────────────────────────
const FEATURES = [
  { Icon: Activity, label: 'Production Monitoring' },
  { Icon: Truck,    label: 'Fleet & Driver Management' },
  { Icon: Package,  label: 'Inventory Tracking' },
];

export const Register: React.FC = () => {
  const { register, verifyOTP, resendOTP, user } = useOperations();
  const navigate = useNavigate();

  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [selectedRole, setSelectedRole] = useState<UserRole>('Owner');
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'mobile'>('email');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    securityQuestion: "What is your best friend's name?",
    securityAnswer: '',
    // Company fields (Owner only)
    companyName: '',
    companyType: 'Logistics',
    companyEmail: '',
    companyPhone: '',
    companyAddress: '',
    gstNumber: '',
    // Driver fields
    driverId: '',
    vehicleNumber: '',
    licenseNumber: ''
  });

  // Company name duplicate-check state
  const [companyNameError, setCompanyNameError] = useState('');
  const [companyNameChecking, setCompanyNameChecking] = useState(false);

  // Driver company lookup state
  const [driverCompanyName, setDriverCompanyName] = useState('');
  const [driverCompanyError, setDriverCompanyError] = useState('');
  const [driverCompanyChecking, setDriverCompanyChecking] = useState(false);
  const [driverCompanyFound, setDriverCompanyFound] = useState(false);

  // 6-Box OTP Inputs State
  const [otpBoxes, setOtpBoxes] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [cooldown, setCooldown] = useState(60);

  const handleGoogleSuccess = (res: any) => {
    if (res.user) {
      navigate(res.user.role === 'Driver' ? '/driver' : '/owner');
    }
  };

  const handleGoogleError = (error: string) => {
    setErrorMsg(error);
  };

  useEffect(() => {
    if (user) navigate(user.role === 'Driver' ? '/driver' : '/owner');
  }, [user, navigate]);

  useEffect(() => {
    let timer: any;
    if (step === 'otp' && cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, cooldown]);

  // Focus box 0 on OTP screen mount
  useEffect(() => {
    if (step === 'otp' && otpInputRefs.current[0]) {
      otpInputRefs.current[0]?.focus();
    }
  }, [step]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear company name error when user types
    if (name === 'companyName') setCompanyNameError('');
  };

  // Real-time duplicate company name check on blur (Owner)
  const handleCompanyNameBlur = async () => {
    const name = formData.companyName.trim();
    if (!name || name.length < 3) return;
    setCompanyNameChecking(true);
    setCompanyNameError('');
    try {
      const result = await api.company.check(name);
      if (!result.available) {
        setCompanyNameError('Company already exists.');
      }
    } catch {
      // silently skip on network error
    } finally {
      setCompanyNameChecking(false);
    }
  };

  // Driver: validate that the company exists (must exist for driver to join)
  const handleDriverCompanyBlur = async () => {
    const name = driverCompanyName.trim();
    if (!name) {
      setDriverCompanyError('Company Name is required.');
      setDriverCompanyFound(false);
      return;
    }
    setDriverCompanyChecking(true);
    setDriverCompanyError('');
    setDriverCompanyFound(false);
    try {
      const result = await api.company.check(name);
      if (result.available) {
        // available = not found in DB = company does NOT exist
        setDriverCompanyError('Company not found. Please enter the correct company name or contact your company administrator.');
        setDriverCompanyFound(false);
      } else {
        // company exists — driver can link to it
        setDriverCompanyFound(true);
        setDriverCompanyError('');
      }
    } catch {
      // silently skip on network error
    } finally {
      setDriverCompanyChecking(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Password and Confirm Password must match.");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    // Owner-specific validations
    if (selectedRole === 'Owner') {
      if (!formData.companyName.trim() || formData.companyName.trim().length < 3) {
        setErrorMsg("Company name is required and must be at least 3 characters.");
        return;
      }
      if (formData.companyName.trim().length > 100) {
        setErrorMsg("Company name must not exceed 100 characters.");
        return;
      }
      if (companyNameError) {
        setErrorMsg(companyNameError);
        return;
      }
    }

    // Driver-specific validations
    if (selectedRole === 'Driver') {
      if (!driverCompanyName.trim()) {
        setErrorMsg("Company Name is required.");
        setDriverCompanyError("Company Name is required.");
        return;
      }
      if (driverCompanyError) {
        setErrorMsg(driverCompanyError);
        return;
      }
      // Re-verify company existence before submitting if not already verified
      if (!driverCompanyFound) {
        try {
          const res = await api.company.check(driverCompanyName.trim());
          if (res.available) {
            const msg = "Company not found. Please enter the correct company name or contact your company administrator.";
            setErrorMsg(msg);
            setDriverCompanyError(msg);
            setDriverCompanyFound(false);
            return;
          } else {
            setDriverCompanyFound(true);
            setDriverCompanyError('');
          }
        } catch {
          // skip
        }
      }
    }

    setLoading(true);
    try {
      const payload: any = {
        fullName: formData.fullName,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        role: selectedRole,
        password: formData.password,
        securityQuestion: formData.securityQuestion,
        securityAnswer: formData.securityAnswer,
        verificationMethod
      };

      if (selectedRole === 'Owner') {
        payload.companyName    = formData.companyName.trim();
        payload.companyType    = formData.companyType;
        payload.companyEmail   = formData.companyEmail.trim();
        payload.companyPhone   = formData.companyPhone.trim();
        payload.companyAddress = formData.companyAddress.trim();
        payload.gstNumber      = formData.gstNumber.trim();
      } else {
        payload.driverCompanyName = driverCompanyName.trim();
        payload.driverId = formData.driverId || `DRV-${Math.floor(Math.random() * 9000) + 1000}`;
        payload.vehicleNumber = formData.vehicleNumber;
        payload.licenseNumber = formData.licenseNumber;
      }

      const res = await register(payload);
      setLoading(false);
      if (res && res.success !== false) {
        // BYPASSED GMAIL/MOBILE OTP VERIFICATION STEP AS REQUESTED
        setStep('success');
        setTimeout(() => {
          navigate('/login');
        }, 1800);
      } else {
        setErrorMsg(res?.message || 'Unable to register account. Please try again.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.response?.data?.message || err.message || 'Unable to register account. Please check your details and try again.');
    }
  };

  // 6-box OTP handlers (auto-advance, backspace, paste)
  const handleOtpBoxChange = (index: number, value: string) => {
    const char = value.slice(-1);
    if (!/^\d*$/.test(char)) return; // numbers only

    const newBoxes = [...otpBoxes];
    newBoxes[index] = char;
    setOtpBoxes(newBoxes);

    if (char && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpBoxes[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      setOtpBoxes(digits);
      otpInputRefs.current[5]?.focus();
    }
  };

  const handleOTPVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const fullOtp = otpBoxes.join('');

    if (fullOtp.length < 6) {
      setErrorMsg("Please enter the complete 6-digit OTP verification code.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        channel: verificationMethod,
        otpCode: fullOtp
      };
      await verifyOTP(payload);
      setLoading(false);
      setStep('success');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.response?.data?.message || 'Invalid OTP code or OTP expired.');
    }
  };

  const handleResendOTP = async () => {
    if (cooldown > 0) return;
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const payload = {
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        channel: verificationMethod
      };
      const res = await resendOTP(payload);
      setLoading(false);
      if (res && res.success === false) {
        setErrorMsg(res.message || 'Verification email could not be sent. Please try again.');
      } else {
        setCooldown(30);
        setOtpBoxes(['', '', '', '', '', '']);
        const dest = verificationMethod === 'mobile' ? formData.mobileNumber : formData.email;
        setSuccessMsg(res?.message || `Fresh 6-digit OTP code sent to your ${verificationMethod === 'mobile' ? 'Mobile Number' : 'Gmail'} (${dest}).`);
        otpInputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setLoading(false);
      setSuccessMsg('');
      setErrorMsg(err.response?.data?.message || 'Verification email could not be sent. Please try again.');
    }
  };

  // Input styling
  const inputBase: React.CSSProperties = {
    width: '100%',
    height: 50,
    borderRadius: DS.radiusInput,
    border: `1px solid ${DS.border}`,
    background: DS.card,
    color: DS.textPrimary,
    padding: '0 16px',
    fontSize: 16,
    fontWeight: 500,
    fontFamily: 'inherit',
    boxShadow: '0 1px 2px 0 rgba(11,28,48,0.02)',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 200ms ease, box-shadow 200ms ease',
  };

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = DS.primary;
    e.currentTarget.style.boxShadow   = `0 0 0 3px ${DS.primaryFocus}, 0 1px 2px 0 rgba(11,28,48,0.02)`;
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = DS.border;
    e.currentTarget.style.boxShadow   = '0 1px 2px 0 rgba(11,28,48,0.02)';
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 700,
    color: DS.textSecondary,
    marginBottom: 6,
    letterSpacing: '0.01em',
  };

  return (
    <div className="login-page-wrapper">
      <style>{`
        .login-page-wrapper {
          min-height: 100vh;
          width: 100vw;
          background: ${DS.bg};
          display: flex;
          align-items: stretch;
          justify-content: center;
          position: relative;
          overflow-x: hidden;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          box-sizing: border-box;
        }
        .login-split-container {
          width: 100%;
          max-width: 1200px;
          height: 100vh;
          display: flex;
          align-items: stretch;
          justify-content: center;
          gap: 40px;
          position: relative;
          z-index: 1;
          padding: 24px;
          margin: 0 auto;
          box-sizing: border-box;
        }
        .login-left-panel {
          flex: 0 0 38%;
          max-width: 440px;
          display: flex;
          flex-direction: column;
          gap: 28px;
          align-self: center;
          flex-shrink: 0;
          padding: 20px 0;
        }
        .login-right-panel {
          flex: 1 1 62%;
          max-width: 560px;
          width: 100%;
          align-self: stretch;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          padding: 20px 0;
          box-sizing: border-box;
          overflow-y: auto;
        }
        .login-card-box {
          background: ${DS.card};
          border-radius: ${DS.radius};
          border: 1px solid ${DS.border};
          box-shadow: ${DS.shadowCard};
          padding: 32px;
          box-sizing: border-box;
          flex-shrink: 0;
          margin: auto 0;
          width: 100%;
        }
        .register-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
          text-align: left;
        }
        .btn-hover-effect {
          transition: transform 200ms ease, box-shadow 200ms ease, opacity 200ms ease;
        }
        .btn-hover-effect:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px ${DS.primaryShadow};
        }

        @media (max-width: 1024px) {
          .login-left-panel {
            flex: 0 0 45%;
            max-width: 420px;
          }
          .login-right-panel {
            flex: 1 1 55%;
          }
          .login-card-box {
            padding: 24px;
          }
        }

        @media (max-width: 768px) {
          .login-split-container {
            height: auto;
            min-height: 100vh;
            flex-direction: column;
            align-items: center;
            gap: 24px;
            padding: 20px 16px;
          }
          .login-left-panel {
            flex: 1 1 100%;
            max-width: 100%;
            align-self: flex-start;
            padding: 10px 0;
          }
          .login-right-panel {
            flex: 1 1 100%;
            max-width: 100%;
            overflow-y: visible;
            padding: 0;
          }
          .login-card-box {
            padding: 20px;
            margin: 0;
          }
          .login-divider {
            display: none;
          }
        }
      `}</style>

      {/* Ambient background dot grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `radial-gradient(${DS.border} 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
        opacity: 0.7,
        pointerEvents: 'none',
      }} />

      {/* Top-right soft teal glow */}
      <div style={{
        position: 'absolute', top: -100, right: -100,
        width: 400, height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,106,106,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Bottom-left glow */}
      <div style={{
        position: 'absolute', bottom: -60, left: -60,
        width: 320, height: 320,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,163,163,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Main split container */}
      <div className="login-split-container">

        {/* LEFT PANEL: Brand identity — fixed vertically centered */}
        <motion.div
          className="login-left-panel"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 400 / 1000, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
            alignSelf: 'center',
            width: '100%',
          }}
        >
          {/* Logo badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 46, height: 46,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <LogoIcon size={46} />
            </div>
            <div>
              <span style={{ fontSize: 22, fontWeight: 800, color: DS.textPrimary, letterSpacing: '-0.03em' }}>
                Smart<span style={{ color: DS.primary }}>Ops</span>
              </span>
              <span style={{
                display: 'block', fontSize: 11, fontWeight: 700,
                color: DS.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: -2,
              }}>
                Enterprise Control
              </span>
            </div>
          </div>

          {/* Heading */}
          <div>
            <h1 style={{
              fontSize: 36, fontWeight: 800,
              color: DS.textPrimary,
              letterSpacing: '-0.03em', lineHeight: 1.2,
              margin: '0 0 12px 0',
            }}>
              Create Your Enterprise Account
            </h1>
            <p style={{
              fontSize: 16, fontWeight: 500,
              color: DS.textSecondary,
              lineHeight: 1.55, margin: 0,
            }}>
              Join SmartOps logistics & manufacturing control network. Single portal for operational management and real-time telemetry.
            </p>
          </div>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {FEATURES.map(({ Icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32,
                  borderRadius: 10,
                  background: DS.surfaceLow,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={16} color={DS.primary} strokeWidth={2} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: DS.textPrimary }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Platform status indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px',
            background: DS.surfaceLow,
            borderRadius: 10, width: 'fit-content',
            border: `1px solid ${DS.border}`,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#10B981', display: 'inline-block',
              boxShadow: '0 0 0 3px rgba(16,185,129,0.2)',
            }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: DS.textSecondary }}>
              SmartOps Gate: <strong style={{ color: DS.textPrimary }}>Operational (v4.1.2)</strong>
            </span>
          </div>
        </motion.div>

        {/* Divider line */}
        <div
          className="login-divider"
          style={{ width: 1, alignSelf: 'stretch', background: DS.border, flexShrink: 0, minHeight: 400 }}
        />

        {/* RIGHT PANEL: scrollable registration column */}
        <div className="login-right-panel">
          <motion.div
            className="login-card-box"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 350 / 1000, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* STEP 1: FORM */}
            {step === 'form' && (
              <>
                <div style={{ marginBottom: 20, textAlign: 'left' }}>
                  <h2 style={{ fontSize: 24, fontWeight: 800, color: DS.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
                    Register Account
                  </h2>
                  <p style={{ fontSize: 14, fontWeight: 500, color: DS.textMuted, margin: '4px 0 0 0' }}>
                    Enter credentials to create your SmartOps enterprise account.
                  </p>
                </div>

                {/* 1. Role / Portal Toggle */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr',
                  background: DS.surfaceLow, borderRadius: DS.radiusInput,
                  border: `1px solid ${DS.border}`, padding: 4, gap: 4, height: 48, marginBottom: 24,
                }}>
                  {PORTALS.map(({ role, label, Icon }) => {
                    const active = selectedRole === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRole(role)}
                        style={{
                          borderRadius: 9,
                          border: active ? `1px solid ${DS.border}` : 'none',
                          cursor: 'pointer',
                          background: active ? DS.card : 'transparent',
                          color: active ? DS.primary : DS.textMuted,
                          fontWeight: active ? 700 : 500,
                          fontSize: 13, fontFamily: 'inherit',
                          boxShadow: active ? DS.shadowSm : 'none',
                          transition: 'all 200ms ease',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                      >
                        <Icon size={16} strokeWidth={2.1} />
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: DS.dangerBg, border: `1px solid ${DS.dangerBorder}`,
                      borderRadius: DS.radiusInput, padding: '12px 16px', marginBottom: 20,
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}
                  >
                    <AlertCircle size={18} color={DS.danger} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: DS.danger }}>{errorMsg}</span>
                  </motion.div>
                )}

                <form onSubmit={handleRegisterSubmit} className="register-form">

                  {/* 2. Full Name */}
                  <div>
                    <label htmlFor="reg-fullname" style={labelStyle}>Full Name <span style={{ color: DS.danger }}>*</span></label>
                    <input
                      id="reg-fullname"
                      type="text"
                      name="fullName"
                      required
                      placeholder="e.g. John Doe"
                      value={formData.fullName}
                      onChange={handleChange}
                      style={inputBase}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>

                  {/* 3. Workspace Email & 4. Mobile Contact */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label htmlFor="reg-email" style={labelStyle}>Workspace Email <span style={{ color: DS.danger }}>*</span></label>
                      <input
                        id="reg-email"
                        type="email"
                        name="email"
                        required
                        placeholder="john@company.com"
                        value={formData.email}
                        onChange={handleChange}
                        style={inputBase}
                        onFocus={onFocus}
                        onBlur={onBlur}
                      />
                    </div>
                    <div>
                      <label htmlFor="reg-mobile" style={labelStyle}>Mobile Contact <span style={{ color: DS.danger }}>*</span></label>
                      <input
                        id="reg-mobile"
                        type="text"
                        name="mobileNumber"
                        required
                        placeholder="+91 99999 99999"
                        value={formData.mobileNumber}
                        onChange={handleChange}
                        style={inputBase}
                        onFocus={onFocus}
                        onBlur={onBlur}
                      />
                    </div>
                  </div>

                  {/* 5. Security Question */}
                  <div>
                    <label htmlFor="reg-security-q" style={labelStyle}>Security Question <span style={{ color: DS.danger }}>*</span></label>
                    <select
                      id="reg-security-q"
                      name="securityQuestion"
                      value={formData.securityQuestion}
                      onChange={(e: any) => setFormData(prev => ({ ...prev, securityQuestion: e.target.value }))}
                      style={{
                        ...inputBase,
                        appearance: 'none',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 14px center',
                        paddingRight: 40,
                        cursor: 'pointer',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                      }}
                    >
                      <option value="What is your best friend's name?">What is your best friend's name?</option>
                      <option value="What was the name of your first pet?">What was the name of your first pet?</option>
                      <option value="In what city were you born?">In what city were you born?</option>
                      <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                    </select>
                  </div>

                  {/* 6. Security Answer */}
                  <div>
                    <label htmlFor="reg-security-a" style={labelStyle}>Security Secret Answer <span style={{ color: DS.danger }}>*</span></label>
                    <input
                      id="reg-security-a"
                      type="text"
                      name="securityAnswer"
                      required
                      placeholder="Secret Answer (e.g. Rahul)"
                      value={formData.securityAnswer}
                      onChange={handleChange}
                      style={inputBase}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>

                  {/* 7. Password & 8. Confirm Password */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label htmlFor="reg-pwd" style={labelStyle}>Password <span style={{ color: DS.danger }}>*</span></label>
                      <div style={{ position: 'relative' }}>
                        <input
                          id="reg-pwd"
                          type={showPwd ? 'text' : 'password'}
                          name="password"
                          required
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={handleChange}
                          style={{ ...inputBase, paddingRight: 44 }}
                          onFocus={onFocus}
                          onBlur={onBlur}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd(!showPwd)}
                          style={{
                            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                            background: 'none', border: 'none', cursor: 'pointer', color: DS.textMuted, padding: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="reg-confirm-pwd" style={labelStyle}>Confirm Password <span style={{ color: DS.danger }}>*</span></label>
                      <div style={{ position: 'relative' }}>
                        <input
                          id="reg-confirm-pwd"
                          type={showConfirmPwd ? 'text' : 'password'}
                          name="confirmPassword"
                          required
                          placeholder="••••••••"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          style={{ ...inputBase, paddingRight: 44 }}
                          onFocus={onFocus}
                          onBlur={onBlur}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                          style={{
                            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                            background: 'none', border: 'none', cursor: 'pointer', color: DS.textMuted, padding: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          {showConfirmPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 9. Company Assignment Card (Driver Registration) */}
                  {selectedRole === 'Driver' && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        background: DS.surfaceLow,
                        borderRadius: DS.radiusInput,
                        border: `1px solid ${DS.border}`,
                        boxShadow: DS.shadowSm,
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                      }}
                    >
                      {/* Integrated Header */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Building size={16} color={DS.primary} strokeWidth={2.2} />
                          <span style={{ fontSize: 14, fontWeight: 800, color: DS.primary, letterSpacing: '0.02em' }}>
                            Company Assignment
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: DS.textMuted, fontWeight: 500, margin: '6px 0 0 0', lineHeight: 1.4 }}>
                          Enter your employer's company name to link your account
                        </p>
                      </div>

                      {/* Input Field */}
                      <div>
                        <label htmlFor="reg-driver-company" style={labelStyle}>
                          Company Name <span style={{ color: DS.danger }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            id="reg-driver-company"
                            type="text"
                            required={selectedRole === 'Driver'}
                            placeholder="Enter registered company name"
                            value={driverCompanyName}
                            onChange={e => {
                              setDriverCompanyName(e.target.value);
                              setDriverCompanyError('');
                              setDriverCompanyFound(false);
                            }}
                            onBlur={handleDriverCompanyBlur}
                            style={{
                              ...inputBase,
                              borderColor: driverCompanyError ? DS.danger : (driverCompanyFound ? '#10B981' : DS.border),
                              boxShadow: driverCompanyError
                                ? `0 0 0 3px rgba(186,26,26,0.1), 0 1px 2px 0 rgba(11,28,48,0.02)`
                                : driverCompanyFound
                                  ? `0 0 0 3px rgba(16,185,129,0.12), 0 1px 2px 0 rgba(11,28,48,0.02)`
                                  : '0 1px 2px 0 rgba(11,28,48,0.02)',
                              paddingRight: 44,
                            }}
                            onFocus={onFocus}
                          />
                          <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                            {driverCompanyChecking ? (
                              <Loader2 size={16} color={DS.textMuted} className="animate-spin" />
                            ) : driverCompanyError ? (
                              <AlertCircle size={16} color={DS.danger} />
                            ) : driverCompanyFound ? (
                              <CheckCircle size={16} color="#10B981" />
                            ) : null}
                          </div>
                        </div>
                        {driverCompanyError ? (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ fontSize: 13, fontWeight: 600, color: DS.danger, margin: '6px 0 0 2px' }}
                          >
                            {driverCompanyError}
                          </motion.p>
                        ) : driverCompanyFound ? (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ fontSize: 13, fontWeight: 600, color: '#10B981', margin: '6px 0 0 2px' }}
                          >
                            ✓ Company found — your account will be linked on registration.
                          </motion.p>
                        ) : (
                          <p style={{ fontSize: 13, fontWeight: 500, color: DS.textMuted, margin: '6px 0 0 2px' }}>
                            Your account will automatically connect with your company's owner.
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Company Information Section (Owner Registration) */}
                  {selectedRole === 'Owner' && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        background: DS.surfaceLow,
                        borderRadius: DS.radiusInput,
                        border: `1px solid ${DS.border}`,
                        boxShadow: DS.shadowSm,
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                      }}
                    >
                      {/* Section Header */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Building size={16} color={DS.primary} strokeWidth={2.2} />
                          <span style={{ fontSize: 14, fontWeight: 800, color: DS.primary, letterSpacing: '0.02em' }}>
                            Company Registration
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: DS.textMuted, fontWeight: 500, margin: '6px 0 0 0', lineHeight: 1.4 }}>
                          Your company becomes the root entity for all SmartOps data
                        </p>
                      </div>

                      {/* Company Name */}
                      <div>
                        <label htmlFor="reg-company-name" style={labelStyle}>
                          Company Name <span style={{ color: DS.danger }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            id="reg-company-name"
                            type="text"
                            name="companyName"
                            required={selectedRole === 'Owner'}
                            placeholder="e.g. SmartOps Logistics Pvt Ltd"
                            value={formData.companyName}
                            onChange={handleChange}
                            onBlur={handleCompanyNameBlur}
                            minLength={3}
                            maxLength={100}
                            style={{
                              ...inputBase,
                              borderColor: companyNameError ? DS.danger : (formData.companyName.trim().length >= 3 && !companyNameError ? '#10B981' : DS.border),
                              boxShadow: companyNameError
                                ? `0 0 0 3px rgba(186,26,26,0.1), 0 1px 2px 0 rgba(11,28,48,0.02)`
                                : (formData.companyName.trim().length >= 3 && !companyNameError
                                  ? `0 0 0 3px rgba(16,185,129,0.12), 0 1px 2px 0 rgba(11,28,48,0.02)`
                                  : '0 1px 2px 0 rgba(11,28,48,0.02)'),
                              paddingRight: 44,
                            }}
                            onFocus={onFocus}
                          />
                          <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                            {companyNameChecking ? (
                              <Loader2 size={16} color={DS.textMuted} className="animate-spin" />
                            ) : companyNameError ? (
                              <AlertCircle size={16} color={DS.danger} />
                            ) : formData.companyName.trim().length >= 3 ? (
                              <CheckCircle size={16} color="#10B981" />
                            ) : null}
                          </div>
                        </div>
                        {companyNameError && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ fontSize: 13, fontWeight: 600, color: DS.danger, margin: '6px 0 0 2px' }}
                          >
                            {companyNameError}
                          </motion.p>
                        )}
                      </div>

                      {/* Company Type */}
                      <div>
                        <label htmlFor="reg-company-type" style={labelStyle}>
                          Company Type <span style={{ color: DS.danger }}>*</span>
                        </label>
                        <select
                          id="reg-company-type"
                          name="companyType"
                          required={selectedRole === 'Owner'}
                          value={formData.companyType}
                          onChange={(e: any) => setFormData(prev => ({ ...prev, companyType: e.target.value }))}
                          style={{
                            ...inputBase,
                            appearance: 'none',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 14px center',
                            paddingRight: 40,
                            cursor: 'pointer',
                          }}
                        >
                          <option value="Logistics">Logistics</option>
                          <option value="Manufacturing">Manufacturing</option>
                          <option value="Warehouse">Warehouse</option>
                          <option value="Transport">Transport</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Company Email & Phone */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div>
                          <label htmlFor="reg-company-email" style={labelStyle}>Company Email</label>
                          <input
                            id="reg-company-email"
                            type="email"
                            name="companyEmail"
                            placeholder="info@company.com"
                            value={formData.companyEmail}
                            onChange={handleChange}
                            style={inputBase}
                            onFocus={onFocus}
                            onBlur={onBlur}
                          />
                        </div>
                        <div>
                          <label htmlFor="reg-company-phone" style={labelStyle}>Company Phone</label>
                          <input
                            id="reg-company-phone"
                            type="text"
                            name="companyPhone"
                            placeholder="+91 99999 99999"
                            value={formData.companyPhone}
                            onChange={handleChange}
                            style={inputBase}
                            onFocus={onFocus}
                            onBlur={onBlur}
                          />
                        </div>
                      </div>

                      {/* Company Address */}
                      <div>
                        <label htmlFor="reg-company-address" style={labelStyle}>Company Address</label>
                        <input
                          id="reg-company-address"
                          type="text"
                          name="companyAddress"
                          placeholder="e.g. 42 Logistics Park, Mumbai, MH 400001"
                          value={formData.companyAddress}
                          onChange={handleChange}
                          style={inputBase}
                          onFocus={onFocus}
                          onBlur={onBlur}
                        />
                      </div>

                      {/* GST Number */}
                      <div>
                        <label htmlFor="reg-gst" style={labelStyle}>
                          GST Number <span style={{ fontSize: 12, fontWeight: 500, color: DS.textMuted }}>(Optional)</span>
                        </label>
                        <input
                          id="reg-gst"
                          type="text"
                          name="gstNumber"
                          placeholder="e.g. 27AABCU9603R1ZV"
                          value={formData.gstNumber}
                          onChange={handleChange}
                          style={inputBase}
                          onFocus={onFocus}
                          onBlur={onBlur}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* 10. Register Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-hover-effect"
                    style={{
                      width: '100%', height: 52,
                      borderRadius: '14px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                      background: DS.primaryGrad, color: '#FFFFFF',
                      fontSize: 16, fontWeight: 700, fontFamily: 'inherit',
                      boxShadow: `0 4px 14px ${DS.primaryShadow}`,
                      opacity: loading ? 0.75 : 1, marginTop: 24,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Register Account</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>

                {/* 11. Google Login Divider & Button */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 16px',
                }}>
                  <div style={{ flex: 1, height: 1, background: DS.border }} />
                  <span style={{ fontSize: 13, color: DS.textDisabled, fontWeight: 500 }}>or</span>
                  <div style={{ flex: 1, height: 1, background: DS.border }} />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <GoogleAuthButton
                    role={selectedRole}
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    label="Sign up with Google"
                  />
                </div>

                {/* 12. Already Have Account */}
                <p style={{ textAlign: 'center', margin: 0, fontSize: 14, fontWeight: 500, color: DS.textSecondary }}>
                  Already have an account?{' '}
                  <Link to="/login" style={{ color: DS.primary, fontWeight: 700, textDecoration: 'none' }}>
                    Sign In
                  </Link>
                </p>
              </>
            )}

            {/* STEP 2: OTP VERIFICATION SCREEN (COMMENTED OUT AS REQUESTED) */}
            {/*
            {step === 'otp' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: DS.surfaceLow, border: `1px solid ${DS.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px auto',
                }}>
                  {verificationMethod === 'mobile' ? (
                    <Phone size={26} color={DS.primary} />
                  ) : (
                    <Mail size={26} color={DS.primary} />
                  )}
                </div>

                <h2 style={{ fontSize: 22, fontWeight: 800, color: DS.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
                  {verificationMethod === 'mobile' ? 'Verify Your Mobile Number' : 'Verify Your Gmail'}
                </h2>
                <p style={{ fontSize: 13, fontWeight: 500, color: DS.textSecondary, margin: '6px 0 20px 0', lineHeight: 1.4 }}>
                  We've sent a 6-digit verification code to{' '}
                  <strong style={{ color: DS.textPrimary }}>
                    {verificationMethod === 'mobile' ? formData.mobileNumber : formData.email}
                  </strong>.
                </p>

                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: DS.dangerBg, border: `1px solid ${DS.dangerBorder}`,
                      borderRadius: DS.radiusInput, padding: '10px 14px', marginBottom: 20,
                      display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                    }}
                  >
                    <AlertCircle size={16} color={DS.danger} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: DS.danger }}>{errorMsg}</span>
                  </motion.div>
                )}

                {successMsg && !errorMsg && (
                  <div style={{
                    background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: DS.radiusInput, padding: '10px 14px', marginBottom: 20,
                    display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                  }}>
                    <CheckCircle size={16} color="#10B981" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#10B981' }}>{successMsg}</span>
                  </div>
                )}

                <form onSubmit={handleOTPVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                    {otpBoxes.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={el => { otpInputRefs.current[idx] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpBoxChange(idx, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(idx, e)}
                        onPaste={handleOtpPaste}
                        style={{
                          width: 48, height: 56,
                          borderRadius: DS.radiusInput,
                          border: `2px solid ${digit ? DS.primary : DS.border}`,
                          background: digit ? DS.surfaceLow : DS.card,
                          color: DS.textPrimary,
                          fontSize: 22, fontWeight: 800,
                          textAlign: 'center', fontFamily: 'inherit',
                          outline: 'none',
                          boxShadow: digit ? `0 0 0 3px ${DS.primaryFocus}` : 'none',
                          transition: 'all 200ms ease',
                        }}
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%', height: 48,
                      borderRadius: DS.radiusBtn, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                      background: DS.primaryGrad, color: '#FFFFFF',
                      fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                      boxShadow: `0 4px 14px ${DS.primaryShadow}`,
                      transition: 'transform 150ms ease, opacity 150ms ease',
                      opacity: loading ? 0.75 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Verifying OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify OTP & Activate</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>

                <div style={{
                  display: 'flex', alignItems: 'center', justify: 'space-between',
                  marginTop: 20, paddingTop: 16, borderTop: `1px solid ${DS.border}`,
                }}>
                  <button
                    type="button"
                    onClick={() => { setStep('form'); setErrorMsg(''); }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: 600, color: DS.textMuted,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    <ArrowLeft size={14} /> Back
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={cooldown > 0 || loading}
                    style={{
                      background: 'none', border: 'none',
                      cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                      fontSize: 12, fontWeight: 700,
                      color: cooldown > 0 ? DS.textDisabled : DS.primary,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                    {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
                  </button>
                </div>
              </div>
            )}
            */}

            {/* STEP 3: SUCCESS ANIMATION */}
            {step === 'success' && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px auto',
                }}>
                  <CheckCircle size={36} color="#10B981" className="animate-bounce" />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: DS.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
                  Email Verified Successfully!
                </h2>
                <p style={{ fontSize: 13, fontWeight: 500, color: DS.textSecondary, margin: '8px 0 24px 0', lineHeight: 1.5 }}>
                  Your <strong style={{ color: DS.primary }}>{selectedRole}</strong> account is activated. Redirecting to Login...
                </p>
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <button style={{
                    width: '100%', height: 48, borderRadius: DS.radiusBtn, border: 'none', cursor: 'pointer',
                    background: DS.primaryGrad, color: '#FFFFFF', fontSize: 14, fontWeight: 700,
                  }}>
                    Proceed to Login
                  </button>
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
