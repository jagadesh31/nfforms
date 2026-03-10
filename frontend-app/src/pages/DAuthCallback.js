import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export function DAuthCallback() {
    const [searchParams] = useSearchParams();
    const { loginWithDauth } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    useEffect(() => {
        const code = searchParams.get('code');

        if (!code) {
            setError('No authorization code received from DAuth');
            return;
        }

        loginWithDauth(code)
            .then(() => {
                navigate('/');
            })
            .catch((err) => {
                let message = 'DAuth login failed';
                try {
                    const parsed = JSON.parse(err.message);
                    message = parsed.message || message;
                } catch {
                    message = err.message || message;
                }
                setError(message);
            });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (error) {
        return (
            <div className="centered-page">
                <div className="card" style={{ maxWidth: 420, textAlign: 'center' }}>
                    <div style={{
                        fontFamily: "'Bangers', cursive",
                        fontSize: '2rem',
                        color: '#D00000',
                        marginBottom: 16,
                    }}>
                        ❌ Login Failed
                    </div>
                    <div className="error" style={{ marginBottom: 16 }}>{error}</div>
                    <button onClick={() => navigate('/login')}>
                        🔙 Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="centered-page">
            <div className="card" style={{ maxWidth: 420, textAlign: 'center' }}>
                <div style={{
                    fontFamily: "'Bangers', cursive",
                    fontSize: '1.5rem',
                    color: '#F2A332',
                }}>
                    ⏳ Authenticating with DAuth...
                </div>
            </div>
        </div>
    );
}
