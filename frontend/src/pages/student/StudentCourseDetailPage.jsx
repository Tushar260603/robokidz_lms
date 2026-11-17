import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { studentApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';
import Alert from '../../components/Alert';
import { ArrowLeft, BookOpen, User, CheckCircle2, PlayCircle, Lock, Video, FileText } from 'lucide-react';

export default function StudentCourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  if (user?.role === 'instructor') {
    return <Navigate to="/instructor" replace />;
  }

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCourseDetail();
  }, [id]);

  const fetchCourseDetail = async () => {
    setLoading(true);
    try {
      const res = await studentApi.getCourseDetail(id);
      setCourse(res.data);
    } catch {
      setError('Course not found or inactive');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'student') {
      setError('Only student accounts can enroll in courses');
      return;
    }

    setEnrolling(true);
    setError('');
    try {
      await studentApi.enroll(id);
      setSuccess('Successfully enrolled! Redirecting to course...');
      setTimeout(() => {
        navigate(`/student/courses/${id}/player`);
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.detail || 'Enrollment failed');
      setEnrolling(false);
    }
  };

  if (loading) return <Loader fullScreen text="Loading course details..." />;

  return (
    <div className="container" style={{ maxWidth: '850px' }}>
      <Link to="/courses" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        <ArrowLeft size={16} />
        <span>Back to Course Catalog</span>
      </Link>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} />

      {course && (
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span className="badge badge-info">{course.category_name || 'General'}</span>
            <span className="badge badge-success">Published</span>
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
            {course.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BookOpen size={16} />
              <span>{course.total_lessons} published lessons</span>
            </div>
            {course.instructors?.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={16} />
                <span>Instructor(s): <strong>{course.instructors.join(', ')}</strong></span>
              </div>
            )}
          </div>

          {/* Overview */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.5rem' }}>
              Course Overview
            </h3>
            <p style={{ color: '#334155', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
              {course.description || 'No detailed description provided for this course yet.'}
            </p>
          </div>

          {/* Course Curriculum / Lessons Info */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--navy)' }}>
                Course Curriculum ({course.lessons?.length || 0} Lessons)
              </h3>
              {!course.is_enrolled && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Lock size={13} color="#94a3b8" /> Content locked until enrollment
                </span>
              )}
            </div>

            {course.lessons && course.lessons.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {course.lessons.map((lesson, idx) => (
                  <div
                    key={lesson.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1.1rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: 'var(--navy)',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        flexShrink: 0
                      }}>
                        {idx + 1}
                      </span>
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {lesson.title}
                        </div>
                        <div style={{ display: 'flex', gap: '0.8rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          {lesson.has_video && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Video size={13} color="var(--red)" /> Video Lesson
                            </span>
                          )}
                          {lesson.materials_count > 0 && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <FileText size={13} color="var(--primary)" /> {lesson.materials_count} file(s)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      {course.is_enrolled ? (
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <CheckCircle2 size={12} /> Available
                        </span>
                      ) : (
                        <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Lock size={12} /> Locked
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                No lessons added to this course yet.
              </p>
            )}
          </div>

          {/* Enrollment CTA Box */}
          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--navy)' }}>
                {course.is_enrolled ? 'You are enrolled in this course' : 'Ready to start learning?'}
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {course.is_enrolled
                  ? 'Access full lesson videos, learning materials, and track your completion.'
                  : 'Enroll now to unlock all lectures, video tutorials, and downloadable materials.'}
              </p>
            </div>

            {course.is_enrolled ? (
              <Link to={`/student/courses/${course.id}/player`} className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', fontSize: '1rem' }}>
                <PlayCircle size={18} />
                <span>Continue Learning</span>
              </Link>
            ) : (
              <button onClick={handleEnroll} disabled={enrolling} className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', fontSize: '1rem' }}>
                <CheckCircle2 size={18} />
                <span>{enrolling ? 'Enrolling...' : 'Enroll in Course'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
