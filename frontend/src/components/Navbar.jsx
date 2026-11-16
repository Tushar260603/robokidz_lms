import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, LogOut, User as UserIcon } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header style={{ background: '#ffffff', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 40 }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.5rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.25rem', color: 'var(--primary)' }}>
          <BookOpen size={24} />
          <span>RoboKidz LMS</span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link to="/courses" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            Course Catalog
          </Link>

          {isAuthenticated ? (
            <>
              {user?.role === 'admin' && (
                <>
                  <Link to="/admin" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Dashboard</Link>
                  <Link to="/admin/users" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Users</Link>
                  <Link to="/admin/courses" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Courses</Link>
                  <Link to="/admin/categories" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Categories</Link>
                </>
              )}

              {user?.role === 'instructor' && (
                <Link to="/instructor" style={{ fontSize: '0.875rem', fontWeight: 500 }}>My Assigned Courses</Link>
              )}

              {user?.role === 'student' && (
                <Link to="/student/my-courses" style={{ fontSize: '0.875rem', fontWeight: 500 }}>My Learning</Link>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem', paddingLeft: '0.75rem', borderLeft: '1px solid var(--border)' }}>
                <span className={`badge badge-${user?.role === 'admin' ? 'danger' : user?.role === 'instructor' ? 'warning' : 'info'}`}>
                  {user?.role?.toUpperCase()}
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{user?.name}</span>
                <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Log out">
                  <LogOut size={14} />
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
