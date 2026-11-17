import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/endpoints';
import Alert from '../../components/Alert';
import { UserPlus, User, Mail, Lock } from 'lucide-react';
import robokidzIcon from '../../assets/robokidz-icon.png';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Name is required'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const res = await authApi.register(name, email, password);
      const { access_token, user } = res.data;
      login(access_token, user);
      navigate('/courses');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const iconStyle = { position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo-wrap">
          <img src={robokidzIcon} alt="RoboKidz" />
          <h2>Join RoboKidz</h2>
          <p>Create a free student account and start learning</p>
        </div>

        <Alert type="error" message={error} onClose={() => setError('')} />

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={15} style={iconStyle} />
              <input type="text" className="form-input" value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Johnson" style={{ paddingLeft: '2.2rem' }} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={iconStyle} />
              <input type="email" className="form-input" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com" style={{ paddingLeft: '2.2rem' }} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(min. 8 characters)</span></label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={iconStyle} />
              <input type="password" className="form-input" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" style={{ paddingLeft: '2.2rem' }} required />
            </div>
          </div>

          <button type="submit" className="btn btn-accent btn-lg" style={{ width: '100%', marginTop: '0.75rem' }} disabled={loading}>
            <UserPlus size={17} />
            <span>{loading ? 'Creating Account…' : 'Create Account'}</span>
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--navy)', fontWeight: 700 }}>Sign In</Link>
        </div>

        <div style={{ marginTop: '1.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
            🤖 Robotics · Coding · AI · Since 2014
          </span>
        </div>
      </div>
    </div>
  );
}
