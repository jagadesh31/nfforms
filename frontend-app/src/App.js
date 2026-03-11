import React, { useState, useRef, useEffect } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import './App.css';
import { useAuth } from './AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { PocDashboard } from './pages/PocDashboard';
import { DcDashboard } from './pages/DcDashboard';
import { EventFillPage } from './pages/EventFillPage';
import { EventResponsesPage } from './pages/EventResponsesPage';

function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setProfileOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleLabel = (role) => {
    const labels = {
      masterAdmin: 'Master Admin',
      admin: 'Admin',
      poc: 'Person of Contact',
      dc: 'Department Coordinator',
    };
    return labels[role] || role;
  };

  const getRoleBadgeShort = (role) => {
    const labels = {
      masterAdmin: 'MASTER',
      admin: 'ADMIN',
      poc: 'POC',
      dc: 'DC',
    };
    return labels[role] || role;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name[0].toUpperCase();
  };

  return (
    <div>
      <header className="topbar">
        <div className="topbar-left">
          <Link to="/" className="logo">
            <img src="/nf-logo.png" alt="NF" />
            <span className="logo-text">NF Forms</span>
          </Link>
        </div>
        <div className="topbar-right">
          {user ? (
            <div className="profile-container" ref={profileRef}>
              <button
                className="profile-avatar"
                onClick={() => setProfileOpen(!profileOpen)}
                title={user.name}
              >
                {getInitials(user.name)}
              </button>
              {profileOpen && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <div className="profile-dropdown-avatar">
                      {getInitials(user.name)}
                    </div>
                    <div className="profile-dropdown-info">
                      <div className="profile-dropdown-name">{user.name}</div>
                      <div className="profile-dropdown-email">{user.email}</div>
                      <span className="profile-dropdown-role">
                        {getRoleBadgeShort(user.role)}
                      </span>
                    </div>
                  </div>
                  <div className="profile-dropdown-divider" />
                  <div className="profile-dropdown-role-full">
                    {getRoleLabel(user.role)}
                  </div>
                  <div className="profile-dropdown-divider" />
                  <button className="profile-dropdown-logout" onClick={handleLogout}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

function HomeRouter() {
  const { user } = useAuth();
  if (!user) return <LoginPage />;
  if (user.role === 'masterAdmin' || user.role === 'admin') return <AdminDashboard />;
  if (user.role === 'poc') return <PocDashboard />;
  return <DcDashboard />;
}

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomeRouter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id/fill"
          element={
            <ProtectedRoute roles={['dc']}>
              <EventFillPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id/responses"
          element={
            <ProtectedRoute roles={['admin', 'masterAdmin', 'poc']}>
              <EventResponsesPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Layout>
  );
}

export default App;
