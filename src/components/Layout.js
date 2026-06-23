import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BRANCH_COLORS = { Prime: '#1D4ED8', Liberty: '#15803D', Marino: '#B45309' };

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const branchColor = user?.branch ? BRANCH_COLORS[user.branch] : '#4F46E5';

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 60 : 220,
        background: '#1E1B4B',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh'
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {!collapsed && (
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px' }}>
                📊 SalesHub
              </div>
              <div style={{
                marginTop: 6, display: 'inline-block',
                background: branchColor, color: 'white',
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20
              }}>
                {user?.role === 'admin' ? '⚡ Admin' : `📍 ${user?.branch}`}
              </div>
            </div>
          )}
          {collapsed && <div style={{ color: 'white', fontSize: 20, textAlign: 'center' }}>📊</div>}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {[
            { to: '/', icon: '🏠', label: 'Dashboard' },
            { to: '/sales', icon: '📝', label: 'Sales Entry' },
            ...(user?.role === 'admin' ? [{ to: '/users', icon: '👥', label: 'Users' }] : [])
          ].map(item => (
            <NavLink key={item.to} to={item.to} end style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 16px', color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
              textDecoration: 'none', background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
              borderLeft: isActive ? '3px solid #818CF8' : '3px solid transparent',
              fontSize: 13, fontWeight: 500, transition: 'all 0.15s'
            })}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {!collapsed && (
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 8 }}>
              Logged in as<br />
              <span style={{ color: 'white', fontWeight: 600 }}>{user?.username}</span>
            </div>
          )}
          <button onClick={handleLogout} className="btn btn-ghost" style={{
            color: 'rgba(255,255,255,0.6)', width: '100%', justifyContent: collapsed ? 'center' : 'flex-start',
            fontSize: 12
          }}>
            🚪 {!collapsed && 'Logout'}
          </button>
          <button onClick={() => setCollapsed(!collapsed)} style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer', width: '100%', marginTop: 4, fontSize: 18, textAlign: 'center'
          }}>
            {collapsed ? '→' : '←'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        <Outlet />
      </main>
    </div>
  );
}
