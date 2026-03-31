import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/dashboard', icon: '◈', label: 'Dashboard' },
  { to: '/expenses', icon: '⊟', label: 'Expenses' },
  { to: '/ai-insights', icon: '◎', label: 'AI Insights' },
];

export default function Layout({ children }) {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">💰</div>
          <span>SpendAI</span>
        </div>

        <nav style={{ flex: 1 }}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div style={{ padding: '12px 4px', borderTop: '1px solid var(--border)', marginBottom: 8 }}>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 2 }}>{user?.name}</p>
            <p style={{ fontSize: 12, color: 'var(--text3)' }}>{user?.email}</p>
          </div>
          <button className="nav-item btn-ghost" onClick={handleLogout} style={{ width: '100%', justifyContent: 'flex-start' }}>
            <span>⏻</span> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
