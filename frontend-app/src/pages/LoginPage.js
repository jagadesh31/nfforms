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
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <img src="/nf-logo.png" alt="NF" style={{ height: 80, filter: 'drop-shadow(0 0 20px rgba(242, 163, 50, 0.5))' }} />
        </div>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <span style={{
            fontFamily: "'Bangers', cursive",
            fontSize: '2.4rem',
            color: '#FFD700',
            textShadow: '2px 2px 0 rgba(0,0,0,0.5)',
            letterSpacing: '4px',
          }}>
            NF Forms
          </span>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #F2A332, #e6952a)',
          color: '#000',
          fontFamily: "'Bangers', cursive",
          fontSize: '1.2rem',
          textAlign: 'center',
          padding: '10px',
          marginBottom: 20,
          borderRadius: '6px',
          letterSpacing: '2px',
        }}>
          Sign In to Continue!
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          {loading ? (
            <div style={{ padding: '10px', color: '#fff' }}>⏳ Logging in...</div>
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

        {error && <div className="error" style={{ textAlign: 'center', marginTop: '10px' }}>{error}</div>}
      </div>
    </div>
  );
}
