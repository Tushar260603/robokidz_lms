import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studentApi } from '../../api/endpoints';
import Loader from '../../components/Loader';
import Alert from '../../components/Alert';
import { BookOpen, PlayCircle, CheckCircle } from 'lucide-react';

export default function StudentMyCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    setLoading(true);
    try {
      const res = await studentApi.getMyCourses();
      setCourses(res.data);
    } catch {
      setError('Failed to fetch your enrolled courses');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen text="Loading your enrolled courses..." />;

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>My Learning</h1>
        <p style={{ color: 'var(--text-muted)' }}>Resume your courses and track your completion progress</p>
      </div>

      <Alert type="error" message={error} />

      {courses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <BookOpen size={48} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>No enrolled courses</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem', marginBottom: '1.5rem' }}>
            You haven't enrolled in any courses yet. Browse our catalog to find exciting topics!
          </p>
          <Link to="/courses" className="btn btn-primary">
            Explore Course Catalog
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {courses.map((course) => (
            <div key={course.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span className="badge badge-info" style={{ marginBottom: '0.5rem' }}>{course.category_name || 'General'}</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{course.title}</h3>

                {course.instructors?.length > 0 && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Instructors: {course.instructors.join(', ')}
                  </div>
                )}

                {/* Progress bar */}
                <div style={{ margin: '1rem 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    <span>Progress ({course.completed_lessons} of {course.total_lessons} lessons)</span>
                    <span>{course.progress_percentage}%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${course.progress_percentage}%` }} />
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <Link to={`/student/courses/${course.id}/player`} className="btn btn-primary" style={{ width: '100%' }}>
                  <PlayCircle size={16} />
                  <span>{course.progress_percentage === 100 ? 'Review Course' : 'Resume Learning'}</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
