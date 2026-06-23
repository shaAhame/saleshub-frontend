import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/');
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4F46E5 100%)',
      padding: 20
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📊</div>
          <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>SalesHub</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 }}>
            Branch Sales Management System
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ marginBottom: 24, fontSize: 18 }}>Sign in to your account</h2>
          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA',
              color: '#DC2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13
            }}>
              ⚠️ {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input className="form-control" placeholder="Enter username"
                value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input className="form-control" type="password" placeholder="Enter password"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14, marginTop: 8 }}>
              {loading ? 'Signing in...' : '→ Sign In'}
            </button>
          </form>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 16, fontSize: 12 }}>
          Prime • Liberty • Marino
        </p>
      </div>
    </div>
  );
}
