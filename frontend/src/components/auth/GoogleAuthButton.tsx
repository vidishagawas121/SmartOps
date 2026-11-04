import React, { useEffect, useState } from 'react';
import { UserRole } from '../../types';
import { Loader2, AlertTriangle, ExternalLink, X } from 'lucide-react';

interface GoogleAuthButtonProps {
  role: UserRole;
  onSuccess: (user: any) => void;
  onError: (errorMessage: string) => void;
  label?: string;
}

declare global {
  interface Window {
    google?: any;
  }
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  role,
  onSuccess,
  onError,
  label = 'Continue with Google'
}) => {
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const rawClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const isConfigured = Boolean(rawClientId && !rawClientId.includes('your_google_client_id'));

  useEffect(() => {
    if (!isConfigured) return;

    if (window.google?.accounts?.id) {
      setSdkReady(true);
      return;
    }

    const existingScript = document.getElementById('google-jssdk');
    if (existingScript) {
      existingScript.addEventListener('load', () => setSdkReady(true));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-jssdk';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setSdkReady(true);
    script.onerror = () => {
      console.warn('Google Identity Services SDK failed to load.');
      setSdkReady(false);
    };
    document.head.appendChild(script);
  }, [isConfigured]);

  const handleGoogleSignIn = () => {
    onError('Google authentication is temporarily disabled.');
    /*
    // TEMPORARILY DISABLED GOOGLE OAUTH INITIALIZATION
    if (loading) return;
    if (!isConfigured) {
      setShowConfigModal(true);
      return;
    }
    ...
    */
  };

  return (
    <div style={{ width: '100%' }}>
      <div id="hidden-google-btn" style={{ display: 'none' }} />
      
      <button
        type="button"
        id="google-auth-btn"
        onClick={handleGoogleSignIn}
        disabled={loading}
        style={{
          width: '100%',
          height: 48,
          borderRadius: 12,
          border: '1px solid #E5EEFF',
          background: '#FFFFFF',
          color: '#0B1C30',
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'inherit',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          boxShadow: '0 1px 3px 0 rgba(11,28,48,0.03), 0 1px 2px -1px rgba(11,28,48,0.02)',
          transition: 'background-color 200ms ease, border-color 200ms ease, box-shadow 200ms ease',
          outline: 'none',
          boxSizing: 'border-box'
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.backgroundColor = '#F8FAFC';
            e.currentTarget.style.borderColor = '#CBD5E1';
            e.currentTarget.style.boxShadow = '0 4px 12px -2px rgba(11,28,48,0.06)';
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
            e.currentTarget.style.borderColor = '#E5EEFF';
            e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(11,28,48,0.03), 0 1px 2px -1px rgba(11,28,48,0.02)';
          }
        }}
      >
        {loading ? (
          <>
            <Loader2 size={16} style={{ animation: 'so-spin 1s linear infinite' }} />
            <span>Connecting to Google…</span>
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{label}</span>
          </>
        )}
      </button>

      {/* Configuration Modal for Google OAuth */}
      {showConfigModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(11, 28, 48, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24
          }}
          onClick={() => setShowConfigModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 18,
              maxWidth: 480,
              width: '100%',
              padding: '28px 24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              border: '1px solid #E5EEFF',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowConfigModal(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748B'
              }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(234, 179, 8, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#CA8A04'
              }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0B1C30' }}>
                  Google OAuth Client ID Required
                </h3>
                <span style={{ fontSize: 12, color: '#64748B' }}>Frontend Setup Instructions</span>
              </div>
            </div>

            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: '0 0 14px 0' }}>
              To enable real Google OAuth Sign-In, please add your Google Cloud OAuth 2.0 Client ID to <code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: 4, color: '#0F172A', fontWeight: 600 }}>frontend/.env</code>:
            </p>

            <div style={{
              background: '#0F172A',
              color: '#38BDF8',
              padding: '12px 14px',
              borderRadius: 10,
              fontSize: 12,
              fontFamily: 'monospace',
              marginBottom: 16,
              overflowX: 'auto',
              border: '1px solid #1E293B'
            }}>
              VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 16px',
                  borderRadius: 10,
                  background: '#F1F5F9',
                  color: '#0F172A',
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                Google Console <ExternalLink size={14} />
              </a>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                style={{
                  padding: '9px 20px',
                  borderRadius: 10,
                  background: '#006A6A',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
