import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentApi } from '../../api/endpoints';
import Loader from '../../components/Loader';
import Alert from '../../components/Alert';
import {
  ArrowLeft, CheckCircle2, Circle, Download,
  Play, FileText, Check, Award
} from 'lucide-react';

export default function StudentCoursePlayerPage() {
  const { id } = useParams();
  const [playerData, setPlayerData] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCoursePlayer();
  }, [id]);

  const fetchCoursePlayer = async (selectLessonId = null) => {
    setLoading(true);
    try {
      const res = await studentApi.getCoursePlayer(id);
      const data = res.data;
      setPlayerData(data);

      if (data.lessons && data.lessons.length > 0) {
        if (selectLessonId) {
          const matched = data.lessons.find((l) => l.id === selectLessonId);
          setActiveLesson(matched || data.lessons[0]);
        } else if (data.next_incomplete_lesson_id) {
          // Resume from first incomplete lesson
          const resumeLesson = data.lessons.find((l) => l.id === data.next_incomplete_lesson_id);
          setActiveLesson(resumeLesson || data.lessons[0]);
        } else {
          setActiveLesson(data.lessons[0]);
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load course player');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!activeLesson || activeLesson.is_completed) return;
    setCompleting(true);
    setError('');
    try {
      await studentApi.markLessonComplete(activeLesson.id);
      setSuccess(`Completed lesson: ${activeLesson.title}!`);
      // Refresh player and stay on current lesson
      await fetchCoursePlayer(activeLesson.id);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to mark lesson complete');
    } finally {
      setCompleting(false);
    }
  };

  const handleDownload = (materialId) => {
    const url = studentApi.downloadMaterialUrl(materialId);
    window.open(url, '_blank');
  };

  if (loading) return <Loader fullScreen text="Loading course player..." />;

  return (
    <div className="container" style={{ maxWidth: '1280px', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <Link to="/student/my-courses" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} />
          <span>Back to My Courses</span>
        </Link>
        {playerData && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Course Progress:</span>
            <div className="progress-bar-bg" style={{ width: '160px' }}>
              <div className="progress-bar-fill" style={{ width: `${playerData.progress_percentage}%` }} />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{playerData.progress_percentage}%</span>
          </div>
        )}
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      {playerData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '1.5rem', alignItems: 'start' }}>
          {/* Main Lesson Content Area */}
          <div className="card" style={{ padding: '1.75rem' }}>
            {activeLesson ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Lesson {activeLesson.position} of {playerData.total_lessons}
                    </span>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>{activeLesson.title}</h2>
                  </div>

                  <div>
                    {activeLesson.is_completed ? (
                      <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.75rem' }}>
                        <Check size={14} />
                        <span>Completed</span>
                      </span>
                    ) : (
                      <button
                        onClick={handleMarkComplete}
                        disabled={completing}
                        className="btn btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        <CheckCircle2 size={16} />
                        <span>{completing ? 'Saving...' : 'Mark as Completed'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Video Embed Player */}
                {activeLesson.video_url && (
                  <div style={{ marginBottom: '1.5rem', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
                    {activeLesson.video_url.includes('youtube.com') || activeLesson.video_url.includes('youtu.be') ? (
                      <iframe
                        src={activeLesson.video_url.replace('watch?v=', 'embed/')}
                        title="Lesson Video"
                        style={{ width: '100%', height: '420px', border: 'none' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div style={{ padding: '1rem', color: 'white', fontSize: '0.875rem' }}>
                        Video link: <a href={activeLesson.video_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>{activeLesson.video_url}</a>
                      </div>
                    )}
                  </div>
                )}

                {/* Lecture Notes / Content */}
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#334155' }}>Lecture Notes</h4>
                  <div style={{ fontSize: '0.925rem', lineHeight: '1.7', color: '#1e293b', whiteSpace: 'pre-wrap', background: '#f8fafc', padding: '1.25rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    {activeLesson.content || 'No text content available for this lesson.'}
                  </div>
                </div>

                {/* Downloadable Materials Section */}
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#334155' }}>
                    Learning Materials & Downloads ({activeLesson.materials?.length || 0})
                  </h4>
                  {activeLesson.materials && activeLesson.materials.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {activeLesson.materials.map((mat) => (
                        <div
                          key={mat.id}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0.75rem 1rem', background: '#ffffff', border: '1px solid var(--border)',
                            borderRadius: '6px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <FileText size={20} color="#2563eb" />
                            <div>
                              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{mat.original_name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {(mat.size_bytes / 1024).toFixed(1)} KB · {mat.mime_type}
                              </div>
                            </div>
                          </div>

                          <button onClick={() => handleDownload(mat.id)} className="btn btn-secondary btn-sm">
                            <Download size={14} />
                            <span>Download</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      No attachments or documents provided for this lesson.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Select a lesson from the syllabus.</p>
            )}
          </div>

          {/* Syllabus / Lessons Sidebar */}
          <div className="card" style={{ padding: '1.25rem', position: 'sticky', top: '5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={18} color="var(--primary)" />
              <span>Course Syllabus</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
              {playerData.lessons.map((lesson) => {
                const isSelected = activeLesson?.id === lesson.id;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLesson(lesson)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.75rem',
                      borderRadius: '6px', textAlign: 'left', border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                      background: isSelected ? '#eff6ff' : '#ffffff', cursor: 'pointer', transition: 'background 0.15s ease'
                    }}
                  >
                    {lesson.is_completed ? (
                      <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0 }} />
                    ) : (
                      <Circle size={18} color="#94a3b8" style={{ flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: isSelected ? 'var(--primary)' : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Lesson {lesson.position}: {lesson.title}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {lesson.materials?.length || 0} material(s)
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
