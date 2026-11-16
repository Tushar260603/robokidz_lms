import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { instructorApi, adminApi } from '../../api/endpoints';
import Loader from '../../components/Loader';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import {
  ArrowLeft, Plus, ChevronUp, ChevronDown, Edit2,
  Trash2, Upload, FileText, Check, Globe
} from 'lucide-react';

export default function InstructorCourseManagePage() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Lesson Create / Edit
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState({ title: '', content: '', video_url: '', status: 'draft' });

  // Material Upload
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    fetchCourseAndLessons();
  }, [id]);

  const fetchCourseAndLessons = async () => {
    setLoading(true);
    try {
      const [courseRes, lessonsRes] = await Promise.all([
        instructorApi.getCourse(id),
        instructorApi.getLessons(id)
      ]);
      setCourse(courseRes.data);
      setLessons(lessonsRes.data);
    } catch {
      setError('Failed to load course details and lessons');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCoursePublish = async () => {
    if (!course) return;
    const nextStatus = course.status === 'published' ? 'draft' : 'published';
    try {
      await instructorApi.updateCoursePublish(id, nextStatus);
      setSuccess(`Course is now ${nextStatus}`);
      fetchCourseAndLessons();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update course status');
    }
  };

  const handleOpenCreateLesson = () => {
    setEditingLesson(null);
    setLessonForm({ title: '', content: '', video_url: '', status: 'draft' });
    setIsLessonModalOpen(true);
  };

  const handleOpenEditLesson = (lesson) => {
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      content: lesson.content || '',
      video_url: lesson.video_url || '',
      status: lesson.status
    });
    setIsLessonModalOpen(true);
  };

  const handleSaveLesson = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingLesson) {
        await instructorApi.updateLesson(id, editingLesson.id, lessonForm);
        setSuccess('Lesson updated in place without affecting student progress');
      } else {
        await instructorApi.createLesson(id, lessonForm);
        setSuccess('Lesson created successfully');
      }
      setIsLessonModalOpen(false);
      fetchCourseAndLessons();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save lesson');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Delete this lesson? Existing student progress will be preserved.')) return;
    setError('');
    try {
      await instructorApi.deleteLesson(id, lessonId);
      setSuccess('Lesson deleted safely (soft-delete)');
      fetchCourseAndLessons();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete lesson');
    }
  };

  // Move lesson Up or Down and persist reorder
  const handleMoveLesson = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    const newLessons = [...lessons];
    const [moved] = newLessons.splice(index, 1);
    newLessons.splice(targetIndex, 0, moved);

    setLessons(newLessons);
    try {
      const ids = newLessons.map((l) => l.id);
      await instructorApi.reorderLessons(id, ids);
      setSuccess('Lesson order saved');
    } catch (err) {
      setError('Failed to update lesson order');
      fetchCourseAndLessons();
    }
  };

  // Material upload handler
  const handleOpenMaterialModal = (lessonId) => {
    setActiveLessonId(lessonId);
    setUploadFile(null);
    setIsMaterialModalOpen(true);
  };

  const handleUploadMaterialSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploadLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      await instructorApi.uploadMaterial(activeLessonId, formData);
      setSuccess(`Material '${uploadFile.name}' uploaded successfully`);
      setIsMaterialModalOpen(false);
      fetchCourseAndLessons();
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Check file type and size.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm('Remove this learning material?')) return;
    try {
      await instructorApi.deleteMaterial(materialId);
      setSuccess('Material removed');
      fetchCourseAndLessons();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete material');
    }
  };

  if (loading) return <Loader fullScreen text="Loading course editor..." />;

  return (
    <div className="container">
      <Link to="/instructor" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
        <ArrowLeft size={16} />
        <span>Back to My Courses</span>
      </Link>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      {/* Course Header Banner */}
      {course && (
        <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{course.title}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Category: {course.category_name || 'General'} · Status: <strong style={{ textTransform: 'capitalize' }}>{course.status}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleToggleCoursePublish}
              className={`btn btn-${course.status === 'published' ? 'secondary' : 'primary'}`}
            >
              <Globe size={16} />
              <span>{course.status === 'published' ? 'Unpublish Course' : 'Publish Course'}</span>
            </button>
            <button onClick={handleOpenCreateLesson} className="btn btn-primary">
              <Plus size={16} />
              <span>Add Lesson</span>
            </button>
          </div>
        </div>
      )}

      {/* Ordered Lessons List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {lessons.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <FileText size={40} color="#94a3b8" style={{ margin: '0 auto 0.5rem' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>No lessons created yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Click 'Add Lesson' to begin structuring this course.
            </p>
          </div>
        ) : (
          lessons.map((lesson, idx) => (
            <div key={lesson.id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {/* Up / Down Reordering Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <button
                      onClick={() => handleMoveLesson(idx, 'up')}
                      disabled={idx === 0}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '2px 6px', opacity: idx === 0 ? 0.3 : 1 }}
                      title="Move up"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => handleMoveLesson(idx, 'down')}
                      disabled={idx === lessons.length - 1}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '2px 6px', opacity: idx === lessons.length - 1 ? 0.3 : 1 }}
                      title="Move down"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>
                        Lesson {lesson.position}:
                      </span>
                      <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{lesson.title}</h4>
                      <span className={`badge badge-${lesson.status === 'published' ? 'success' : 'warning'}`}>
                        {lesson.status}
                      </span>
                    </div>
                    {lesson.video_url && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Video: {lesson.video_url}
                      </div>
                    )}
                  </div>
                </div>

                {/* Lesson Actions */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleOpenMaterialModal(lesson.id)} className="btn btn-secondary btn-sm" title="Upload Material">
                    <Upload size={14} />
                    <span>Upload Material</span>
                  </button>
                  <button onClick={() => handleOpenEditLesson(lesson)} className="btn btn-secondary btn-sm" title="Edit">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDeleteLesson(lesson.id)} className="btn btn-danger btn-sm" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Lesson Materials Sub-list */}
              {lesson.materials && lesson.materials.length > 0 && (
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Attached Materials ({lesson.materials.length}):
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {lesson.materials.map((m) => (
                      <div
                        key={m.id}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                          background: '#f8fafc', border: '1px solid var(--border)',
                          padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem'
                        }}
                      >
                        <FileText size={14} color="#64748b" />
                        <span>{m.original_name}</span>
                        <span style={{ color: '#94a3b8' }}>({(m.size_bytes / 1024).toFixed(0)} KB)</span>
                        <button
                          onClick={() => handleDeleteMaterial(m.id)}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0 2px' }}
                          title="Remove file"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Lesson Modal */}
      <Modal isOpen={isLessonModalOpen} onClose={() => setIsLessonModalOpen(false)} title={editingLesson ? 'Edit Lesson' : 'Create New Lesson'} maxWidth="650px">
        <form onSubmit={handleSaveLesson}>
          <div className="form-group">
            <label className="form-label">Lesson Title</label>
            <input
              type="text"
              className="form-input"
              value={lessonForm.title}
              onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
              placeholder="e.g. Kinematics of Differential Drive Robots"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Video URL (Optional embed link)</label>
            <input
              type="url"
              className="form-input"
              value={lessonForm.video_url}
              onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
              placeholder="https://youtube.com/..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={lessonForm.status}
              onChange={(e) => setLessonForm({ ...lessonForm, status: e.target.value })}
            >
              <option value="draft">Draft (hidden from students)</option>
              <option value="published">Published (accessible to enrolled students)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Lesson Content / Notes (Markdown or Text)</label>
            <textarea
              className="form-textarea"
              rows={6}
              value={lessonForm.content}
              onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
              placeholder="Detailed lecture notes, instructions, or reading material..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setIsLessonModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingLesson ? 'Update Lesson' : 'Create Lesson'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Material Upload Modal */}
      <Modal isOpen={isMaterialModalOpen} onClose={() => setIsMaterialModalOpen(false)} title="Upload Learning Material">
        <form onSubmit={handleUploadMaterialSubmit}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Allowed formats: <strong>PDF, Images (PNG, JPG), Word (DOC, DOCX), PPT, TXT</strong>. Max size: <strong>20 MB</strong>.
          </p>

          <div className="form-group">
            <input
              type="file"
              className="form-input"
              onChange={(e) => setUploadFile(e.target.files[0])}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setIsMaterialModalOpen(false)} className="btn btn-secondary" disabled={uploadLoading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={uploadLoading || !uploadFile}>
              {uploadLoading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
