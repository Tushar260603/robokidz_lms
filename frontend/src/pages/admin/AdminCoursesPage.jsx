import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/endpoints';
import Loader from '../../components/Loader';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import { BookPlus, Search, Edit2, Trash2, Power, Users, Eye } from 'lucide-react';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [instructorsList, setInstructorsList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({ title: '', description: '', category_id: '', status: 'draft' });

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignCourseId, setAssignCourseId] = useState(null);
  const [selectedInstructors, setSelectedInstructors] = useState([]);
  const [instSearch, setInstSearch] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [page, catFilter]);

  const fetchInitialData = async () => {
    try {
      const [catRes, instRes] = await Promise.all([
        adminApi.getCategories(),
        adminApi.getUsers({ role: 'instructor', is_active: true, page_size: 100 })
      ]);
      setCategories(catRes.data);
      setInstructorsList(instRes.data.items);
    } catch {
      // Non-blocking
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 10 };
      if (catFilter) params.category_id = catFilter;
      if (search.trim()) params.search = search.trim();
      const res = await adminApi.getCourses(params);
      setCourses(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      setError('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCourses();
  };

  const handleOpenCreateCourse = () => {
    setEditingCourse(null);
    setCourseForm({ title: '', description: '', category_id: categories[0]?.id || '', status: 'draft' });
    setIsCourseModalOpen(true);
  };

  const handleOpenEditCourse = (course) => {
    setEditingCourse(course);
    setCourseForm({
      title: course.title,
      description: course.description || '',
      category_id: course.category_id || '',
      status: course.status
    });
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        title: courseForm.title,
        description: courseForm.description,
        category_id: courseForm.category_id ? parseInt(courseForm.category_id) : null,
        status: courseForm.status
      };

      if (editingCourse) {
        await adminApi.updateCourse(editingCourse.id, payload);
        setSuccess('Course updated successfully');
      } else {
        await adminApi.createCourse(payload);
        setSuccess('Course created successfully');
      }
      setIsCourseModalOpen(false);
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save course');
    }
  };

  const handleToggleCourseStatus = async (course) => {
    setError('');
    try {
      await adminApi.setCourseStatus(course.id, !course.is_active);
      setSuccess(`Course ${course.is_active ? 'deactivated' : 'activated'} safely`);
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update course status');
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    setError('');
    try {
      await adminApi.deleteCourse(id);
      setSuccess('Course deleted successfully');
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete course');
    }
  };

  const handleOpenAssignModal = async (courseId) => {
    setAssignCourseId(courseId);
    setInstSearch('');
    try {
      const res = await adminApi.getCourse(courseId);
      const currentInstIds = res.data.instructors.map(i => i.id);
      setSelectedInstructors(currentInstIds);
      setIsAssignModalOpen(true);
    } catch {
      setError('Failed to load course instructors');
    }
  };

  const handleSaveAssignInstructors = async (e) => {
    e.preventDefault();
    try {
      await adminApi.assignInstructors(assignCourseId, selectedInstructors);
      setSuccess('Instructors assigned successfully');
      setIsAssignModalOpen(false);
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to assign instructors');
    }
  };

  const toggleInstructorSelection = (id) => {
    if (selectedInstructors.includes(id)) {
      setSelectedInstructors(selectedInstructors.filter(item => item !== id));
    } else {
      setSelectedInstructors([...selectedInstructors, id]);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>📚 Course Management</h1>
            <p>Create courses, assign instructors, and monitor enrollment</p>
          </div>
          <button type="button" onClick={handleOpenCreateCourse} className="btn btn-accent" style={{ position: 'relative', zIndex: 2, cursor: 'pointer' }}>
            <BookPlus size={16} />
            <span>Create Course</span>
          </button>
        </div>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      {/* Filter and Search */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '250px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search course title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary">
            <Search size={16} />
          </button>
        </form>

        <select
          className="form-select"
          style={{ width: '180px' }}
          value={catFilter}
          onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <Loader text="Loading courses..." />
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Active</th>
                <th>Enrollments</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.length > 0 ? (
                courses.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {c.description ? (c.description.length > 60 ? c.description.slice(0, 60) + '...' : c.description) : 'No description'}
                      </div>
                    </td>
                    <td>{c.category_name || 'Uncategorized'}</td>
                    <td>
                      <span className={`badge badge-${c.status === 'published' ? 'success' : 'warning'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${c.is_active ? 'success' : 'danger'}`}>
                        {c.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{c.enrollments_count}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link to={`/admin/courses/${c.id}`} className="btn btn-secondary btn-sm" title="View details and students">
                          <Eye size={14} />
                        </Link>
                        <button onClick={() => handleOpenAssignModal(c.id)} className="btn btn-secondary btn-sm" title="Assign Instructors">
                          <Users size={14} />
                        </button>
                        <button onClick={() => handleOpenEditCourse(c)} className="btn btn-secondary btn-sm" title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleToggleCourseStatus(c)} className="btn btn-secondary btn-sm" title={c.is_active ? 'Deactivate' : 'Activate'}>
                          <Power size={14} color={c.is_active ? '#dc2626' : '#16a34a'} />
                        </button>
                        <button onClick={() => handleDeleteCourse(c.id)} className="btn btn-danger btn-sm" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No courses found.</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {Math.ceil(total / 10) > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.25rem',
              borderTop: '1px solid var(--border)',
              background: '#ffffff',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Showing <strong>{((page - 1) * 10) + 1}</strong> - <strong>{Math.min(page * 10, total)}</strong> of <strong>{total}</strong> courses
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-secondary btn-sm"
                  style={{ opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                >
                  ← Previous
                </button>

                {Array.from({ length: Math.ceil(total / 10) }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    className={`btn btn-sm ${pageNum === page ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ minWidth: '32px' }}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setPage(p => Math.min(Math.ceil(total / 10), p + 1))}
                  disabled={page === Math.ceil(total / 10)}
                  className="btn btn-secondary btn-sm"
                  style={{ opacity: page === Math.ceil(total / 10) ? 0.5 : 1, cursor: page === Math.ceil(total / 10) ? 'not-allowed' : 'pointer' }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Course Edit/Create Modal */}
      <Modal isOpen={isCourseModalOpen} onClose={() => setIsCourseModalOpen(false)} title={editingCourse ? 'Edit Course' : 'Create Course'}>
        <form onSubmit={handleSaveCourse}>
          <div className="form-group">
            <label className="form-label">Course Title</label>
            <input
              type="text"
              className="form-input"
              value={courseForm.title}
              onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={courseForm.category_id}
              onChange={(e) => setCourseForm({ ...courseForm, category_id: e.target.value })}
            >
              <option value="">Select Category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={courseForm.status}
              onChange={(e) => setCourseForm({ ...courseForm, status: e.target.value })}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={courseForm.description}
              onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setIsCourseModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingCourse ? 'Update Course' : 'Create Course'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Instructors Modal */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Assign Instructors">
        <form onSubmit={handleSaveAssignInstructors}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Select active instructors who can manage lessons and learning materials for this course:
          </p>

          {/* Selected tags */}
          {selectedInstructors.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
              {selectedInstructors.map(id => {
                const inst = instructorsList.find(i => i.id === id);
                if (!inst) return null;
                return (
                  <span key={id} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                    background: 'var(--primary)', color: '#fff',
                    borderRadius: '999px', padding: '0.2rem 0.65rem',
                    fontSize: '0.78rem', fontWeight: 500
                  }}>
                    {inst.name}
                    <button
                      type="button"
                      onClick={() => toggleInstructorSelection(id)}
                      style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: '0.9rem' }}
                      title="Remove"
                    >×</button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Search input */}
          <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search by name or email…"
              value={instSearch}
              onChange={e => setInstSearch(e.target.value)}
              style={{ paddingLeft: '2rem' }}
              autoComplete="off"
            />
          </div>

          {/* Instructor list */}
          <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '6px' }}>
            {(() => {
              const q = instSearch.toLowerCase().trim();
              const filtered = instructorsList.filter(i =>
                i.name.toLowerCase().includes(q) || i.email.toLowerCase().includes(q)
              );
              if (filtered.length === 0) {
                return (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No instructors found
                  </div>
                );
              }
              return filtered.map(inst => {
                const checked = selectedInstructors.includes(inst.id);
                return (
                  <label key={inst.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.65rem',
                    padding: '0.55rem 0.85rem', cursor: 'pointer',
                    background: checked ? 'rgba(79,70,229,0.07)' : 'transparent',
                    borderBottom: '1px solid var(--border)',
                    transition: 'background 0.15s'
                  }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleInstructorSelection(inst.id)}
                      style={{ accentColor: 'var(--primary)', width: '15px', height: '15px', flexShrink: 0 }}
                    />
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: checked ? 600 : 400 }}>{inst.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inst.email}</div>
                    </div>
                    {checked && (
                      <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>✓ Assigned</span>
                    )}
                  </label>
                );
              });
            })()}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {selectedInstructors.length} instructor{selectedInstructors.length !== 1 ? 's' : ''} selected
            </span>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" onClick={() => setIsAssignModalOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Assignments
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
