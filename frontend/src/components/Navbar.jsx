import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Rocket } from 'lucide-react';
import robokidzIcon from '../assets/robokidz-icon.png';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleBadgeStyle = {
    admin:      { background: 'rgba(237,27,30,0.25)',   color: '#fca5a5' },
    instructor: { background: 'rgba(255,214,0,0.25)',   color: '#FFD600' },
    student:    { background: 'rgba(255,255,255,0.15)', color: '#fff' },
  };
  const rbs = roleBadgeStyle[user?.role] || roleBadgeStyle.student;

  return (
    <header className="rk-navbar">
      <div className="rk-navbar-inner">
        {/* Brand */}
        <Link to={user?.role === 'instructor' ? '/instructor' : user?.role === 'admin' ? '/admin' : '/courses'} className="rk-brand">
          <img src={robokidzIcon} alt="RoboKidz" className="rk-brand-logo" />
          <span className="rk-brand-text">RoboKidz <span>LMS</span></span>
        </Link>

        {/* Nav links */}
        <nav className="rk-nav-links">
          {user?.role !== 'instructor' && (
            <NavLink to="/courses" className={({ isActive }) => `rk-nav-link${isActive ? ' active' : ''}`}>
              Catalog
            </NavLink>
          )}

          {isAuthenticated ? (
            <>
              {user?.role === 'admin' && (
                <>
                  <NavLink to="/admin" end className={({ isActive }) => `rk-nav-link${isActive ? ' active' : ''}`}>Dashboard</NavLink>
                  <NavLink to="/admin/users"      className={({ isActive }) => `rk-nav-link${isActive ? ' active' : ''}`}>Users</NavLink>
                  <NavLink to="/admin/courses"    className={({ isActive }) => `rk-nav-link${isActive ? ' active' : ''}`}>Courses</NavLink>
                  <NavLink to="/admin/categories" className={({ isActive }) => `rk-nav-link${isActive ? ' active' : ''}`}>Categories</NavLink>
                </>
              )}

              {user?.role === 'instructor' && (
                <NavLink to="/instructor" className={({ isActive }) => `rk-nav-link${isActive ? ' active' : ''}`}>
                  My Courses
                </NavLink>
              )}

              {user?.role === 'student' && (
                <NavLink to="/student/my-courses" className={({ isActive }) => `rk-nav-link${isActive ? ' active' : ''}`}>
                  My Learning
                </NavLink>
              )}

              {/* User info */}
              <div className="rk-nav-user">
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em',
                  padding: '0.15rem 0.6rem', borderRadius: '999px',
                  ...rbs
                }}>
                  {user?.role?.toUpperCase()}
                </span>
                <span className="rk-nav-user-name">{user?.name}</span>
                <button onClick={handleLogout} className="rk-logout-btn" title="Log out">
                  <LogOut size={13} />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '0.5rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">Log in</Link>
              <Link to="/register" className="btn btn-accent btn-sm">Register</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
