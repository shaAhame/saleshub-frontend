import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Browsers only offer "Save password?" for <input type="password"> inside a form.
// We use a text box with masked characters instead, and no <form>, so the
// browser never saves (or auto-fills) the password on showroom computers.
const MASK_SUPPORTED =
  typeof CSS !== 'undefined' && CSS.supports && CSS.supports('-webkit-text-security', 'disc');

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [unlocked, setUnlocked] = useState({ u: false, p: false });

  // Random field names every visit – nothing for the browser to remember
  const names = useMemo(() => {
    const r = Math.random().toString(36).slice(2, 10);
    return { u: `f_${r}_a`, p: `f_${r}_b` };
  }, []);

  const handleLogin = async () => {
    if (loading) return;
    if (!username || !password) return setError('Please enter username and password');
    setLoading(true);
    setError('');
    try {
      await login(username.trim(), password);
      setPassword('');
      navigate('/');
    } catch (err) {
      setPassword('');
      setError(err.response?.data?.error || 'Invalid username or password');
    } finally { setLoading(false); }
  };

  const onEnter = (e) => { if (e.key === 'Enter') { e.preventDefault(); handleLogin(); } };

  const inputStyle = { fontSize: 15, padding: '12px 14px', borderRadius: 10 };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F9FAFB'
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        border: '1px solid #E5E7EB'
      }}>
        <div role="group">
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block' }}>
              Username
            </label>
            <input
              className="form-control"
              type="text"
              name={names.u}
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={onEnter}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              readOnly={!unlocked.u}
              onFocus={() => setUnlocked(s => ({ ...s, u: true }))}
              data-lpignore="true"
              data-form-type="other"
              style={inputStyle}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block' }}>
              Password
            </label>
            <input
              className="form-control"
              type={MASK_SUPPORTED ? 'text' : 'password'}
              name={names.p}
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={onEnter}
              autoComplete={MASK_SUPPORTED ? 'off' : 'new-password'}
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              readOnly={!unlocked.p}
              onFocus={() => setUnlocked(s => ({ ...s, p: true }))}
              data-lpignore="true"
              data-form-type="other"
              style={{ ...inputStyle, WebkitTextSecurity: 'disc' }}
            />
          </div>

          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: 8, padding: '10px 14px',
              color: '#DC2626', fontSize: 13, marginBottom: 20
            }}>
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%', padding: '13px',
              background: loading ? '#A5B4FC' : '#4F46E5',
              color: 'white', border: 'none', borderRadius: 10,
              fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
