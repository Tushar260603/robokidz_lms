import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '../../api/endpoints';
import Loader from '../../components/Loader';
import Alert from '../../components/Alert';
import { ArrowLeft, Users, UserCheck } from 'lucide-react';

export default function AdminCourseDetailPage() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourseDetail();
  }, [id]);

  const fetchCourseDetail = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCourse(id);
      setCourse(res.data);
    } catch {
      setError('Failed to fetch course details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen text="Loading course details..." />;

  return (
    <div className="container">
      <Link to="/admin/courses" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
        <ArrowLeft size={16} />
        <span>Back to Courses</span>
      </Link>

      <Alert type="error" message={error} />

      {course && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{course.title}</h1>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Category: {course.category_name || 'Uncategorized'}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span className={`badge badge-${course.status === 'published' ? 'success' : 'warning'}`}>{course.status}</span>
                <span className={`badge badge-${course.is_active ? 'success' : 'danger'}`}>{course.is_active ? 'Active' : 'Disabled'}</span>
              </div>
            </div>

            <p style={{ marginTop: '1rem', fontSize: '0.925rem', color: '#334155' }}>
              {course.description || 'No description provided.'}
            </p>

            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Assigned Instructors
              </h4>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {course.instructors.length > 0 ? (
                  course.instructors.map((inst) => (
                    <span key={inst.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#f1f5f9', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem' }}>
                      <UserCheck size={14} color="#2563eb" />
                      <span>{inst.name} ({inst.email})</span>
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No instructors assigned yet.</span>
                )}
              </div>
            </div>
          </div>

          {/* Enrolled Students Table */}
          <div className="card">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} />
              <span>Enrolled Students ({course.enrolled_students.length})</span>
            </h3>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Enrolled Date</th>
                    <th>Learning Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {course.enrolled_students.length > 0 ? (
                    course.enrolled_students.map((student) => (
                      <tr key={student.id}>
                        <td style={{ fontWeight: 600 }}>{student.name}</td>
                        <td>{student.email}</td>
                        <td>{new Date(student.enrolled_at).toLocaleDateString()}</td>
                        <td style={{ width: '220px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="progress-bar-bg">
                              <div className="progress-bar-fill" style={{ width: `${student.progress_percentage}%` }} />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, minWidth: '40px' }}>
                              {student.progress_percentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No students enrolled yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
