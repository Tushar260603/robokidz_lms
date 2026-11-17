import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studentApi } from '../../api/endpoints';
import Loader from '../../components/Loader';
import Alert from '../../components/Alert';
import { PlayCircle, Layers, Trophy } from 'lucide-react';

export default function StudentMyCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchMyCourses(); }, []);

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

  if (loading) return <Loader text="Loading your courses…" />;

  return (
    <div className="container">
      <div className="page-header">
        <h1>🎓 My Learning</h1>
        <p>Resume your courses and track your completion progress</p>
      </div>

      <Alert type="error" message={error} />

      {courses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.5rem' }}>No enrolled courses yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Browse our catalog and start your robotics journey!
          </p>
          <Link to="/courses" className="btn btn-accent btn-lg">🚀 Explore Courses</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {courses.map((course) => {
            const done = course.progress_percentage === 100;
            return (
              <div key={course.id} className="course-card">
                {/* Card header */}
                <div className="course-card-header" style={done ? { background: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)' } : {}}>
                  <span className="course-card-category">{course.category_name || 'General'}</span>
                  {done && (
                    <span style={{ marginLeft: 'auto', background: 'var(--yellow)', color: 'var(--navy)', borderRadius: '999px', padding: '0.15rem 0.6rem', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Trophy size={11} /> Completed!
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="course-card-body">
                  <h3 className="course-card-title">{course.title}</h3>
                  {course.instructors?.length > 0 && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      👨‍🏫 {course.instructors.join(', ')}
                    </div>
                  )}

                  {/* Progress */}
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--navy)' }}>
                      <span>{course.completed_lessons} / {course.total_lessons} lessons</span>
                      <span style={{ color: done ? 'var(--success)' : 'var(--navy)' }}>{course.progress_percentage}%</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${course.progress_percentage}%`, background: done ? 'linear-gradient(90deg, #15803d, #16a34a)' : undefined }} />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="course-card-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    <Layers size={13} /> {course.total_lessons} lessons
                  </div>
                  <Link to={`/student/courses/${course.id}/player`} className={`btn btn-sm ${done ? 'btn-secondary' : 'btn-primary'}`}>
                    <PlayCircle size={13} />
                    <span>{done ? 'Review' : 'Resume'}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
