import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import {
  getToken, getUser, setSession, clearSession, touch, idleFor, purgeOldStorage
} from '../utils/session';

const AuthContext = createContext();

const SESSION_TIMEOUT = 3 * 60 * 1000;          // 3 minutes of inactivity
const WARNING_AT = SESSION_TIMEOUT - 30 * 1000;  // warn 30 seconds before

// Old version kept the login in localStorage forever (12 hours) – remove it.
purgeOldStorage();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const u = getUser();
    // Restored tab / reopened browser after being idle → not logged in
    if (u && (!getToken() || idleFor() > SESSION_TIMEOUT)) {
      clearSession();
      return null;
    }
    return u;
  });
  const [showWarning, setShowWarning] = useState(false);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setShowWarning(false);
  }, []);

  // Confirm role + branch with the server (never trust what is stored in the browser)
  useEffect(() => {
    if (!user) return;
    api.get('/auth/me')
      .then(({ data }) => {
        if (data.role !== user.role || data.branch !== user.branch || data.username !== user.username) {
          setSession(getToken(), data);
          setUser(data);
        }
      })
      .catch(() => {}); // 401/403 handled by api interceptor
  }, [user?.id]);

  // Inactivity tracking – based on a timestamp, so it still works after
  // sleep, background tabs, or a restored browser session.
  useEffect(() => {
    if (!user) return;
    touch();

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    let last = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - last > 1000) { last = now; touch(); }
    };
    events.forEach(e => window.addEventListener(e, onActivity, { passive: true }));

    const check = () => {
      if (!getToken()) { logout(); return; }
      const idle = idleFor();
      if (idle >= SESSION_TIMEOUT) logout();
      else setShowWarning(idle >= WARNING_AT);
    };
    const interval = setInterval(check, 5000);
    document.addEventListener('visibilitychange', check);

    return () => {
      events.forEach(e => window.removeEventListener(e, onActivity));
      clearInterval(interval);
      document.removeEventListener('visibilitychange', check);
    };
  }, [user, logout]);

  const login = async (username, password) => {
    clearSession();
    const { data } = await api.post('/auth/login', { username, password });
    setSession(data.token, data.user);
    setUser(data.user);
    return data;
  };

  const stayLoggedIn = () => { touch(); setShowWarning(false); };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}

      {/* Session Warning Popup */}
      {showWarning && user && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)'
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: '32px 28px',
            maxWidth: 360, width: '90%', textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⏰</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1E1B4B', marginBottom: 8 }}>
              Session Expiring
            </div>
            <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>
              You will be automatically logged out in <strong>30 seconds</strong> due to inactivity.
            </div>
            <button
              onClick={stayLoggedIn}
              style={{
                width: '100%', padding: '12px', background: '#4F46E5',
                color: 'white', border: 'none', borderRadius: 10,
                fontSize: 15, fontWeight: 700, cursor: 'pointer'
              }}>
              Stay Logged In
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
