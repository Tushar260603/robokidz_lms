import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/endpoints';
import Loader from '../../components/Loader';
import Alert from '../../components/Alert';
import { Users, BookOpen, Award, CheckCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await adminApi.getStats();
      setStats(res.data);
    } catch (err) {
      setError('Failed to load admin stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen text="Loading statistics..." />;

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Overview of users, courses, and platform engagement</p>
      </div>

      <Alert type="error" message={error} />

      {/* Quick Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: '#e0e7ff', color: '#4338ca', borderRadius: '8px' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Users</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats?.total_users || 0}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {stats?.users_by_role?.student || 0} students · {stats?.users_by_role?.instructor || 0} instructors
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: '#dbeafe', color: '#1d4ed8', borderRadius: '8px' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Courses</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats?.total_courses || 0}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: '#fef3c7', color: '#b45309', borderRadius: '8px' }}>
            <Award size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Enrollments</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats?.total_enrollments || 0}</div>
          </div>
        </div>
      </div>

      {/* Course Completion Monitoring Table */}
      <div className="card">
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Course Enrollment & Completion Rates</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Published Lessons</th>
                <th>Total Enrolled</th>
                <th>Completed (100%)</th>
                <th>Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              {stats?.course_stats?.length > 0 ? (
                stats.course_stats.map((cs) => (
                  <tr key={cs.course_id}>
                    <td style={{ fontWeight: 600 }}>{cs.title}</td>
                    <td>{cs.published_lessons_count}</td>
                    <td>{cs.total_enrolled}</td>
                    <td>{cs.completed_students_count}</td>
                    <td style={{ width: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="progress-bar-bg">
                          <div className="progress-bar-fill" style={{ width: `${cs.completion_rate_percentage}%` }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, minWidth: '40px' }}>
                          {cs.completion_rate_percentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No courses found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
