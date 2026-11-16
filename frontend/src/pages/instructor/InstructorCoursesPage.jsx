import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { instructorApi } from '../../api/endpoints';
import Loader from '../../components/Loader';
import Alert from '../../components/Alert';
import { BookOpen, Users, Settings } from 'lucide-react';

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAssignedCourses();
  }, []);

  const fetchAssignedCourses = async () => {
    setLoading(true);
    try {
      const res = await instructorApi.getCourses();
      setCourses(res.data);
    } catch {
      setError('Failed to fetch assigned courses');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen text="Loading assigned courses..." />;

  return (
    <div className="container">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>My Assigned Courses</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage course lessons, learning materials, and student progress</p>
      </div>

      <Alert type="error" message={error} />

      {courses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <BookOpen size={48} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>No courses assigned</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            You haven't been assigned to teach any courses yet. Contact the administrator.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {courses.map((c) => (
            <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className="badge badge-info">{c.category_name || 'General'}</span>
                  <span className={`badge badge-${c.status === 'published' ? 'success' : 'warning'}`}>
                    {c.status}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>{c.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem', minHeight: '2.5rem' }}>
                  {c.description ? (c.description.length > 90 ? c.description.slice(0, 90) + '...' : c.description) : 'No description'}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#475569', marginBottom: '1.25rem' }}>
                  <Users size={16} />
                  <span><strong>{c.enrollments_count}</strong> enrolled student(s)</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <Link to={`/instructor/courses/${c.id}/manage`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                  <Settings size={14} />
                  <span>Manage Lessons</span>
                </Link>
                <Link to={`/instructor/courses/${c.id}/students`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                  <Users size={14} />
                  <span>Students</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
