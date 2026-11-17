import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/endpoints';
import Loader from '../../components/Loader';
import Alert from '../../components/Alert';
import { Users, BookOpen, Award, TrendingUp, GraduationCap } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const res = await adminApi.getStats();
      setStats(res.data);
    } catch {
      setError('Failed to load admin stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen text="Loading dashboard…" />;

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.total_users || 0,
      sub: `${stats?.users_by_role?.student || 0} students · ${stats?.users_by_role?.instructor || 0} instructors`,
      Icon: Users,
      iconBg: 'rgba(12,14,91,0.1)', iconColor: 'var(--navy)',
    },
    {
      label: 'Total Courses',
      value: stats?.total_courses || 0,
      sub: 'Published & draft courses',
      Icon: BookOpen,
      iconBg: 'rgba(237,27,30,0.1)', iconColor: 'var(--red)',
    },
    {
      label: 'Total Enrollments',
      value: stats?.total_enrollments || 0,
      sub: 'Active student enrollments',
      Icon: Award,
      iconBg: 'rgba(255,214,0,0.25)', iconColor: '#92610a',
    },
    {
      label: 'Completed Students',
      value: stats?.course_stats?.reduce((a, c) => a + (c.completed_students_count || 0), 0) || 0,
      sub: 'Students with 100% progress',
      Icon: GraduationCap,
      iconBg: 'rgba(22,163,74,0.1)', iconColor: 'var(--success)',
    },
  ];

  return (
    <div className="container">
      {/* Page header */}
      <div className="page-header">
        <h1>Admin Dashboard 🚀</h1>
        <p>Overview of users, courses, and platform engagement</p>
      </div>

      <Alert type="error" message={error} />

      {/* Stat cards */}
      <div className="stats-grid">
        {statCards.map(({ label, value, sub, Icon, iconBg, iconColor }) => (
          <div key={label} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', background: iconBg, color: iconColor, borderRadius: '10px', flexShrink: 0 }}>
                <Icon size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.3rem' }}>{label}</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1, color: 'var(--navy)', marginBottom: '0.3rem' }}>{value}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{sub}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.75rem' }}>
        {[
          { to: '/admin/users', label: '👥 Manage Users' },
          { to: '/admin/courses', label: '📚 Manage Courses' },
          { to: '/admin/categories', label: '🏷️ Categories' },
        ].map(({ to, label }) => (
          <Link key={to} to={to} className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem' }}>
            {label}
          </Link>
        ))}
      </div>

      {/* Course completion table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <TrendingUp size={18} color="var(--navy)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--navy)' }}>Course Enrollment &amp; Completion Rates</h3>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Published Lessons</th>
                <th>Total Enrolled</th>
                <th>Avg. Student Progress</th>
                <th>Completed (100%)</th>
              </tr>
            </thead>
            <tbody>
              {stats?.course_stats?.length > 0 ? (
                stats.course_stats.map((cs) => (
                  <tr key={cs.course_id}>
                    <td>
                      <Link to={`/admin/courses/${cs.course_id}`} style={{ fontWeight: 600, color: 'var(--navy)', textDecoration: 'underline' }}>
                        {cs.title}
                      </Link>
                    </td>
                    <td>{cs.published_lessons_count}</td>
                    <td>
                      <span className="badge badge-info">{cs.total_enrolled}</span>
                    </td>
                    <td style={{ width: '220px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div className="progress-bar-bg" style={{ flex: 1 }}>
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${cs.average_progress_percentage ?? cs.completion_rate_percentage}%` }}
                          />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, minWidth: '42px', color: 'var(--navy)' }}>
                          {cs.average_progress_percentage ?? cs.completion_rate_percentage}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>
                        {cs.completed_students_count} / {cs.total_enrolled}
                      </span>
                      {cs.total_enrolled > 0 && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                          ({cs.completion_rate_percentage}%)
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No courses yet. <Link to="/admin/courses" style={{ color: 'var(--navy)', fontWeight: 600 }}>Create one →</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
