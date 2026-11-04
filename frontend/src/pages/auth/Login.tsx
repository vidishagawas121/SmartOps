import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useOperations } from '../../store/OperationsContext';
import { UserRole } from '../../types';
import { motion } from 'framer-motion';
import {
  Factory,
  HardHat,
  Eye,
  EyeOff,
  Truck,
  KeyRound,
  ArrowRight,
  Loader2,
  AlertCircle,
  Activity,
  Package,
} from 'lucide-react';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';
import { LogoIcon } from '../../components/common/LogoIcon';

// ── Design tokens — exact values from SmartOps dashboard design system ────────
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
  // Exact shadow from theme.css
  shadowSm:       '0 1px 3px 0 rgba(11,28,48,0.03), 0 1px 2px -1px rgba(11,28,48,0.02)',
  shadowMd:       '0 4px 12px -2px rgba(11,28,48,0.05), 0 2px 6px -2px rgba(11,28,48,0.03)',
  shadowCard:     '0 1px 3px 0 rgba(11,28,48,0.03), 0 4px 12px -4px rgba(11,28,48,0.04)',
  radius:         '18px',   // --radius-2xl from theme
  radiusInput:    '12px',   // --radius-lg from theme
  radiusBtn:      '12px',
};

// ── 4 Unified Operational Portals ─────────────────────────────────────────────
const PORTALS: {
  role: UserRole;
  label: string;
  badge: string;
  Icon: React.FC<{ size?: number; strokeWidth?: number }>;
  demoEmail: string;
}[] = [
  { role: 'Owner',      label: 'Owner',      badge: 'Executive', Icon: KeyRound, demoEmail: 'owner@smartops.com' },
  { role: 'Supervisor', label: 'Supervisor', badge: 'Factory',   Icon: Factory,  demoEmail: 'supervisor@smartops.com' },
  { role: 'Driver',     label: 'Driver',     badge: 'Logistics', Icon: Truck,    demoEmail: 'driver@smartops.com' },
  { role: 'Worker',     label: 'Worker',     badge: 'Shopfloor', Icon: HardHat,  demoEmail: 'worker@smartops.com' },
];

// ── Features (3 bullets only) ─────────────────────────────────────────────────
const FEATURES = [
  { Icon: Activity, label: 'Production Monitoring' },
  { Icon: Truck,    label: 'Fleet & Driver Management' },
  { Icon: Package,  label: 'Inventory Tracking' },
];

// ─────────────────────────────────────────────────────────────────────────────
export const Login: React.FC = () => {
  const { login, user } = useOperations();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole>('Owner');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPwd,      setShowPwd]      = useState(false);
  const [rememberMe,   setRememberMe]   = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [errorMsg,     setErrorMsg]     = useState('');

  // Unchanged auth logic ──────────────────────────────────────────────────────
  React.useEffect(() => {
    if (user) {
      if (user.role === 'Driver') navigate('/driver');
      else if (user.role === 'Supervisor') navigate('/supervisor');
      else if (user.role === 'Worker') navigate('/worker');
      else navigate('/owner');
    }
  }, [user, navigate]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg('');
    const target = PORTALS.find(p => p.role === role);
    if (target && (!email || PORTALS.some(p => p.demoEmail === email))) {
      setEmail(target.demoEmail);
      if (!password) setPassword('password123');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const loggedInUser: any = await login(email, selectedRole, password);
      setLoading(false);
      const userRole = (loggedInUser?.role || selectedRole).toLowerCase();
      if (userRole === 'driver') navigate('/driver');
      else if (userRole === 'supervisor') navigate('/supervisor');
      else if (userRole === 'worker') navigate('/worker');
      else navigate('/owner');
    } catch (err: any) {
      setLoading(false);
      console.error('[SmartOps Login Diagnostic Error]:', err);
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setErrorMsg('Network timeout: Backend server took too long to respond. Please try again.');
      } else if (err.message === 'Network Error' || !err.response) {
        setErrorMsg('Backend server is not running or unreachable at http://localhost:5000. Please ensure the Express server is running.');
      } else if (err.response?.status === 404) {
        setErrorMsg(err.response?.data?.message || 'API endpoint not found. Please check backend server routes.');
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        setErrorMsg(err.response?.data?.message || 'Authentication failed. Please verify your email and password.');
      } else if (err.response?.data?.message) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg('Login request failed. Please check server logs or network status.');
      }
    }
  };

  const handleGoogleSuccess = (res: any) => {
    if (res.user) {
      navigate(res.user.role === 'Driver' ? '/driver' : '/owner');
    }
  };

  const handleGoogleError = (error: string) => {
    setErrorMsg(error);
  };

  // Input style helpers ───────────────────────────────────────────────────────
  const inputBase: React.CSSProperties = {
    width: '100%',
    height: 48,
    borderRadius: DS.radiusInput,
    border: `1px solid ${DS.border}`,
    background: DS.card,
    color: DS.textPrimary,
    padding: '0 16px',
    fontSize: 14,
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
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: DS.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      WebkitFontSmoothing: 'antialiased',
    }}>

      {/* Dot-grid — background ambient texture ──────────────── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `radial-gradient(circle, ${DS.border} 1.2px, transparent 1.2px)`,
        backgroundSize: '24px 24px',
        opacity: 0.7,
      }} />

      {/* Very subtle ambient glows ──────────────────────────── */}
      <div style={{
        position: 'absolute', top: -100, left: -60, pointerEvents: 'none',
        width: 450, height: 450, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(0,106,106,0.07) 0%, transparent 70%)`,
      }} />
      <div style={{
        position: 'absolute', bottom: -60, right: -40, pointerEvents: 'none',
        width: 380, height: 380, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(0,163,163,0.06) 0%, transparent 70%)`,
      }} />

      {/* ══════════════════════════════════════════════
          PRO-UI CENTERED SPLIT CONTAINER (1100px MAX)
      ══════════════════════════════════════════════ */}
      <div style={{
        maxWidth: 1100,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 56,
        position: 'relative',
        zIndex: 1,
      }}>

        {/* LEFT PANEL — BRANDING & VALUE PROP ──────── */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="login-left-panel"
          style={{
            flex: '1 1 500px',
            maxWidth: 500,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {/* Content ─────────────────────────────────── */}
          <div style={{ width: '100%' }}>

            {/* Logo — matches dashboard sidebar logo exactly */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 44 }}>
              <div style={{
                width: 42, height: 42,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <LogoIcon size={42} />
              </div>
              <div>
                <div style={{
                  fontSize: 20, fontWeight: 900, color: DS.textPrimary,
                  lineHeight: 1, letterSpacing: '-0.4px',
                }}>
                  Smart<span style={{ color: DS.primary }}>Ops</span>
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 600, color: DS.textMuted,
                  letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2,
                }}>
                  Manufacturing ERP Suite
                </div>
              </div>
            </div>

            {/* Headline — h1 from design system */}
            <h1 style={{
              fontSize: 36,
              fontWeight: 800,
              lineHeight: 1.16,
              letterSpacing: '-0.03em',
              color: DS.textPrimary,
              margin: 0,
            }}>
              Run your manufacturing business on one{' '}
              <span style={{ color: DS.primary }}>intelligent</span> platform.
            </h1>

            {/* Tagline */}
            <div style={{
              marginTop: 18,
              display: 'flex', alignItems: 'baseline', gap: 10,
              fontSize: 16, fontWeight: 700, letterSpacing: '-0.2px',
            }}>
              <span style={{ color: DS.textPrimary }}>Manage.</span>
              <span style={{ color: DS.textMuted }}>Monitor.</span>
              <span style={{
                background: DS.primaryGrad,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>Maximize.</span>
            </div>

            {/* 3 feature bullets */}
            <ul style={{
              listStyle: 'none', margin: '28px 0 0', padding: 0,
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              {FEATURES.map(({ Icon, label }) => (
                <li key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(0,106,106,0.08)',
                    border: `1px solid rgba(0,106,106,0.12)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={13} color={DS.primary} strokeWidth={2.2} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 500, color: DS.textSecondary }}>
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Right-panel separator line ───────────────── */}
        <div className="login-divider" style={{
          width: 1,
          height: 410,
          background: DS.border,
          flexShrink: 0,
          opacity: 0.8,
        }} />

        {/* RIGHT PANEL — LOGIN CARD ──────────────────── */}
        <div style={{
          flex: '1 1 450px',
          maxWidth: 450,
          display: 'flex',
          justifyContent: 'center',
        }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.06 }}
            style={{ width: '100%', maxWidth: 440 }}
          >

          {/* Mobile-only logo */}
          <div className="login-mobile-logo" style={{
            display: 'none', alignItems: 'center', gap: 8,
            marginBottom: 24, justifyContent: 'center',
          }}>
            <div style={{
              width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <LogoIcon size={36} />
            </div>
            <span style={{ fontSize: 17, fontWeight: 900, color: DS.textPrimary }}>
              Smart<span style={{ color: DS.primary }}>Ops</span>
            </span>
          </div>

          {/* ── Card — identical style to dashboard cards ───────────── */}
          <div style={{
            background: DS.card,
            borderRadius: DS.radius,
            border: `1px solid ${DS.border}`,
            boxShadow: DS.shadowCard,
            padding: 32,
          }}>

            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <h2 style={{
                fontSize: 22,
                fontWeight: 700,
                color: DS.textPrimary,
                letterSpacing: '-0.02em',
                lineHeight: 1.3,
                margin: 0,
              }}>
                Welcome Back
              </h2>
              <p style={{
                fontSize: 14,
                fontWeight: 500,
                color: DS.textSecondary,
                margin: '5px 0 0',
                lineHeight: 1.5,
              }}>
                Sign in to your SmartOps workspace.
              </p>
            </div>

            {/* Error message — matches dashboard danger pattern */}
            {errorMsg && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '10px 12px', marginBottom: 20,
                background: DS.dangerBg,
                border: `1px solid ${DS.dangerBorder}`,
                borderRadius: DS.radiusInput,
                color: DS.danger,
                fontSize: 13, fontWeight: 500,
              }}>
                <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Email ─────────────────────────────────────────────────── */}
              <div>
                <label htmlFor="login-email" style={labelStyle}>Email</label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  style={inputBase}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>

              {/* Password ─────────────────────────────────────────────── */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label htmlFor="login-password" style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                  <Link
                    to="/forgot-password"
                    style={{
                      fontSize: 12, fontWeight: 600, color: DS.primary,
                      textDecoration: 'none', letterSpacing: '0.01em',
                    }}
                  >
                    Forgot password?
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-password"
                    type={showPwd ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    style={{ ...inputBase, paddingRight: 44 }}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                  <button
                    type="button"
                    id="toggle-password-visibility"
                    tabIndex={-1}
                    onClick={() => setShowPwd(v => !v)}
                    style={{
                      position: 'absolute', right: 14, top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: 0, color: DS.textMuted,
                      display: 'flex', alignItems: 'center',
                    }}
                  >
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Remember me ─────────────────────────────────────────── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label
                  htmlFor="remember-me"
                  style={{ fontSize: 13, fontWeight: 500, color: DS.textSecondary, cursor: 'pointer' }}
                >
                  Keep me signed in
                </label>
              </div>

              {/* Portal selector — 4 Unified Operational Dashboards */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Operational Portal</label>
                  <span style={{ fontSize: 11, fontWeight: 600, color: DS.primary }}>
                    4 Connected Dashboards
                  </span>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  background: DS.surfaceLow,
                  borderRadius: DS.radiusInput,
                  border: `1px solid ${DS.border}`,
                  padding: 3,
                  gap: 3,
                  minHeight: 46,
                }}>
                  {PORTALS.map(({ role, label, Icon }) => {
                    const active = selectedRole === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        id={`portal-${role.toLowerCase()}`}
                        onClick={() => handleRoleSelect(role)}
                        style={{
                          borderRadius: 9,
                          border: active ? `1px solid ${DS.border}` : 'none',
                          cursor: 'pointer',
                          background: active ? DS.card : 'transparent',
                          color: active ? DS.primary : DS.textMuted,
                          fontWeight: active ? 700 : 500,
                          fontSize: 12,
                          fontFamily: 'inherit',
                          boxShadow: active ? DS.shadowSm : 'none',
                          transition: 'all 200ms ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          padding: '8px 2px',
                        }}
                      >
                        <Icon size={13} strokeWidth={2.1} />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick 1-Click Demo Login Bar */}
              <div style={{
                padding: '10px 12px',
                background: DS.surfaceLow,
                borderRadius: DS.radiusInput,
                border: `1px solid ${DS.border}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: DS.textSecondary, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                    ⚡ 1-Click Demo Access
                  </span>
                  <span style={{ fontSize: 10, color: DS.textMuted, fontWeight: 500 }}>
                    Auto-fills role & password
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {PORTALS.map(({ role, label, Icon, demoEmail }) => {
                    const isSelected = selectedRole === role;
                    return (
                      <button
                        key={`demo-${role}`}
                        type="button"
                        id={`demo-fill-${role.toLowerCase()}`}
                        onClick={() => {
                          setSelectedRole(role);
                          setEmail(demoEmail);
                          setPassword('password123');
                          setErrorMsg('');
                        }}
                        style={{
                          padding: '6px 4px',
                          background: isSelected ? DS.card : 'rgba(255,255,255,0.7)',
                          border: `1px solid ${isSelected ? DS.primary : DS.border}`,
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 600,
                          color: isSelected ? DS.primary : DS.textSecondary,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 3,
                          transition: 'all 150ms ease',
                        }}
                        title={`Fill ${role} credentials (${demoEmail})`}
                      >
                        <Icon size={11} strokeWidth={2} />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sign In — exact dashboard primary button style ─────── */}
              <motion.button
                type="submit"
                id="login-submit-btn"
                disabled={loading}
                whileHover={!loading ? { y: -2, boxShadow: `0 6px 20px 0 rgba(0,106,106,0.25)` } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                style={{
                  width: '100%', height: 48,
                  borderRadius: DS.radiusBtn,
                  border: 'none',
                  background: loading ? 'rgba(0,106,106,0.5)' : DS.primaryGrad,
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: `0 2px 8px 0 ${DS.primaryShadow}`,
                  transition: 'opacity 200ms ease',
                  marginTop: 4,
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} style={{ animation: 'so-spin 1s linear infinite' }} />
                    Signing in…
                  </>
                ) : (
                  <>Sign In <ArrowRight size={14} /></>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              margin: '20px 0 16px',
            }}>
              <div style={{ flex: 1, height: 1, background: DS.border }} />
              <span style={{ fontSize: 12, color: DS.textDisabled }}>or</span>
              <div style={{ flex: 1, height: 1, background: DS.border }} />
            </div>

            {/* Google OAuth Button */}
            <div style={{ marginBottom: 20 }}>
              <GoogleAuthButton
                role={selectedRole}
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
              />
            </div>

            {/* Create account */}
            <p style={{
              textAlign: 'center', margin: 0,
              fontSize: 13, fontWeight: 500, color: DS.textSecondary,
            }}>
              Don't have an account?{' '}
              <Link
                to="/register"
                id="create-account-link"
                style={{ color: DS.primary, fontWeight: 600, textDecoration: 'none' }}
              >
                Create Account
              </Link>
            </p>
          </div>

          {/* Below-card version note — matches dashboard footer style */}
          <p style={{
            textAlign: 'center', marginTop: 16,
            fontSize: 12, fontWeight: 500, color: DS.textDisabled,
          }}>
            SmartOps ERP · Enterprise Platform
          </p>

        </motion.div>
      </div>
    </div>

      {/* ── Global animation + responsive ─────────────────────────────────── */}
      <style>{`
        @keyframes so-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          .login-left-panel  { display: none !important; }
          .login-divider     { display: none !important; }
          .login-mobile-logo { display: flex !important; }
        }
      `}</style>
    </div>
  );
};
