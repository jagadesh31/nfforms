import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { GoogleLogin } from '@react-oauth/google';

export function LoginPage() {
  const { user, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate('/');
    return null;
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle(credentialResponse.credential);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to login with Google.');
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google login failed.');
  };

  return (
    <div className="centered-page">
      <div className="card" style={{ maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/nf-logo.png" alt="NF" style={{ height: 60, opacity: 0.9 }} />
        </div>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <span style={{
            fontWeight: 700,
            fontSize: '1.8rem',
            color: 'var(--gold)',
            letterSpacing: '-0.5px',
          }}>
            NF Forms
          </span>
        </div>
        <div style={{
          color: 'var(--grey-text)',
          fontWeight: 500,
          fontSize: '1rem',
          textAlign: 'center',
          marginBottom: 32,
        }}>
          Sign in to continue
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          {loading ? (
            <div style={{ padding: '10px', color: 'var(--grey-text)' }}>Logging in...</div>
          ) : (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="filled_black"
              text="continue_with"
            />
          )}
        </div>

        {error && <div className="error" style={{ textAlign: 'center', marginTop: '16px' }}>{error}</div>}
      </div>
    </div>
  );
}
