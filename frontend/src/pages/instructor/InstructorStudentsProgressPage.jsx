import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { instructorApi, adminApi } from '../../api/endpoints';
import Loader from '../../components/Loader';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import { ArrowLeft, Users, Eye, CheckCircle2, Circle } from 'lucide-react';

export default function InstructorStudentsProgressPage() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Per-student progress drill-down modal
  const [selectedStudentProgress, setSelectedStudentProgress] = useState(null);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [progressLoading, setProgressLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        instructorApi.getCourse(id),
        instructorApi.getCourseStudents(id)
      ]);
      setCourse(cRes.data);
      setStudents(sRes.data);
    } catch {
      setError('Failed to fetch enrolled students and progress');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStudentDetail = async (studentId) => {
    setProgressLoading(true);
    setProgressModalOpen(true);
    try {
      const res = await instructorApi.getStudentProgress(id, studentId);
      setSelectedStudentProgress(res.data);
    } catch {
      setError('Failed to load student progress details');
    } finally {
      setProgressLoading(false);
    }
  };

  if (loading) return <Loader fullScreen text="Loading student roster..." />;

  return (
    <div className="container">
      <Link to="/instructor" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
        <ArrowLeft size={16} />
        <span>Back to My Courses</span>
      </Link>

      <Alert type="error" message={error} onClose={() => setError('')} />

      {course && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{course.title}</h1>
          <p style={{ color: 'var(--text-muted)' }}>Student Roster & Completion Monitoring</p>
        </div>
      )}

      <div className="card">
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={18} />
          <span>Enrolled Students ({students.length})</span>
        </h3>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Email</th>
                <th>Enrolled Date</th>
                <th>Completion %</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? (
                students.map((student) => (
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
                    <td>
                      <button
                        onClick={() => handleOpenStudentDetail(student.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Eye size={14} />
                        <span>Inspect Lessons</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No students enrolled in this course yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Progress Breakdown Modal */}
      <Modal isOpen={progressModalOpen} onClose={() => setProgressModalOpen(false)} title="Student Progress Breakdown" maxWidth="600px">
        {progressLoading ? (
          <Loader text="Loading lesson completion breakdown..." />
        ) : selectedStudentProgress ? (
          <div>
            <div style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{selectedStudentProgress.student_name}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{selectedStudentProgress.student_email}</div>
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Overall Progress:</span>
                <div className="progress-bar-bg" style={{ width: '150px' }}>
                  <div className="progress-bar-fill" style={{ width: `${selectedStudentProgress.progress_percentage}%` }} />
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>
                  {selectedStudentProgress.completed_lessons_count} / {selectedStudentProgress.total_published_lessons} ({selectedStudentProgress.progress_percentage}%)
                </span>
              </div>
            </div>

            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#334155' }}>
              Lesson Completion Checklist:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {selectedStudentProgress.lessons.map((lesson) => (
                <div
                  key={lesson.lesson_id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem', background: lesson.is_completed ? '#f0fdf4' : '#f8fafc',
                    borderRadius: '6px', border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {lesson.is_completed ? (
                      <CheckCircle2 size={18} color="#16a34a" />
                    ) : (
                      <Circle size={18} color="#94a3b8" />
                    )}
                    <span style={{ fontSize: '0.875rem', fontWeight: lesson.is_completed ? 600 : 400 }}>
                      Lesson {lesson.position}: {lesson.title}
                    </span>
                  </div>
                  {lesson.is_completed && lesson.completed_at && (
                    <span style={{ fontSize: '0.75rem', color: '#15803d' }}>
                      Completed {new Date(lesson.completed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
