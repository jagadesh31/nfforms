import React from 'react';
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    const labels = {
      masterAdmin: 'MASTER',
      admin: 'ADMIN',
      poc: 'POC',
      dc: 'DC',
    };
    return (
      <span className="status-badge" style={{ backgroundColor: '#2C2C2E', color: role === 'masterAdmin' || role === 'admin' ? '#F2A332' : '#ffffff', border: '1px solid var(--border)' }}>
        {labels[role] || role}
      </span>
    );
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
            <>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fff', fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '0.9rem' }}>
                {user.name} {getRoleBadge(user.role)}
              </span>
              <button onClick={handleLogout}>Logout</button>
            </>
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
