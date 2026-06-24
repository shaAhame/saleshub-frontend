import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BRANCH_COLORS = { Prime: '#1D4ED8', Liberty: '#15803D', Marino: '#B45309' };

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const branchColor = user?.branch ? BRANCH_COLORS[user.branch] : '#4F46E5';

  const navItems = [
    { to: '/', icon: '🏠', label: 'Dashboard' },
    { to: '/sales', icon: '📝', label: 'Sales Entry' },
    ...(user?.role === 'admin' ? [{ to: '/users', icon: '👥', label: 'Users' }] : [])
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* Top Nav Bar (Mobile + Desktop) */}
      <header style={{
        background: '#1E1B4B', color: 'white',
        padding: '0 16px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>📊</span>
          <span style={{ fontWeight: 800, fontSize: 16 }}>SalesHub</span>
          <span style={{
            background: branchColor, color: 'white',
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, marginLeft: 4
          }}>
            {user?.role === 'admin' ? '⚡ Admin' : `📍 ${user?.branch}`}
          </span>
        </div>

        {/* Desktop Nav */}
        <nav style={{ display: 'none', gap: 4 }} className="desktop-nav">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
              color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
              textDecoration: 'none',
              background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
              borderRadius: 8, fontSize: 13, fontWeight: 500
            })}>
              {item.icon} {item.label}
            </NavLink>
          ))}
          <button onClick={handleLogout} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.7)',
            padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, marginLeft: 8
          }}>🚪 Logout</button>
        </nav>

        {/* Mobile Hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)} style={{
          background: 'none', border: 'none', color: 'white',
          fontSize: 22, cursor: 'pointer', padding: 4
        }} className="mobile-menu-btn">
          {menuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div style={{
          background: '#1E1B4B', borderBottom: '1px solid rgba(255,255,255,0.1)',
          position: 'sticky', top: 56, zIndex: 99
        }}>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end
              onClick={() => setMenuOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '14px 20px', color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                textDecoration: 'none', borderLeft: isActive ? '3px solid #818CF8' : '3px solid transparent',
                background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                fontSize: 14, fontWeight: 500
              })}>
              <span style={{ fontSize: 18 }}>{item.icon}</span> {item.label}
            </NavLink>
          ))}
          <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 8 }}>
              Logged in as <strong style={{ color: 'white' }}>{user?.username}</strong>
            </div>
            <button onClick={handleLogout} style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
              padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, width: '100%'
            }}>🚪 Logout</button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main style={{ flex: 1, padding: '16px', maxWidth: 1200, width: '100%', margin: '0 auto' }}>
        <Outlet />
      </main>

      {/* CSS for desktop nav */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </div>
  );
}
