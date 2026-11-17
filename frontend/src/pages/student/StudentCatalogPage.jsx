import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { studentApi, adminApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';
import Alert from '../../components/Alert';
import { Search, BookOpen, ArrowRight, Layers } from 'lucide-react';

// Emoji icons per category
const catEmoji = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('robot'))    return '🤖';
  if (n.includes('code') || n.includes('program')) return '💻';
  if (n.includes('electron')) return '⚡';
  if (n.includes('ai') || n.includes('machine'))   return '🧠';
  if (n.includes('astro'))    return '🔭';
  return '🎓';
};

export default function StudentCatalogPage() {
  const { user } = useAuth();
  if (user?.role === 'instructor') {
    return <Navigate to="/instructor" replace />;
  }

  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchCourses(); }, [page, catFilter]);

  const fetchCategories = async () => {
    try {
      const res = await adminApi.getCategories();
      setCategories(res.data);
    } catch { /* non-blocking */ }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 9 };
      if (catFilter) params.category_id = catFilter;
      if (search.trim()) params.search = search.trim();
      const res = await studentApi.getCourses(params);
      setCourses(res.data.items);
      setTotal(res.data.total);
    } catch {
      setError('Failed to fetch course catalog');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCourses();
  };

  const totalPages = Math.ceil(total / 9);

  return (
    <div className="container">
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%)',
        borderRadius: '16px', padding: '2.5rem 2rem', textAlign: 'center',
        marginBottom: '2rem', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '150px', height: '150px', background: 'rgba(255,214,0,0.12)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '100px', height: '100px', background: 'rgba(237,27,30,0.12)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🤖</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '0.6rem' }}>
            Explore Courses
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', maxWidth: '500px', margin: '0 auto' }}>
            Master Robotics, Coding &amp; AI with hands-on lessons built for young engineers.
          </p>
        </div>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />

      {/* Search & Filter */}
      <div className="card" style={{ marginBottom: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search courses by title or topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.4rem' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0 1.5rem' }}>
            <Search size={15} />
            <span>Search</span>
          </button>
        </form>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => { setCatFilter(''); setPage(1); }}
            className={`btn btn-sm ${catFilter === '' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '999px', padding: '0.35rem 0.9rem' }}
          >
            All Courses
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => { setCatFilter(String(c.id)); setPage(1); }}
              className={`btn btn-sm ${catFilter === String(c.id) ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: '999px', padding: '0.35rem 0.9rem' }}
            >
              {catEmoji(c.name)} {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {total} course{total !== 1 ? 's' : ''} found
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <Loader text="Discovering courses…" />
      ) : courses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.5rem' }}>No published courses found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
            The catalog displays only courses that have been marked as <strong>Published</strong>. Courses currently saved as <strong>Draft</strong> are hidden from public/student view.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link to="/admin/courses" className="btn btn-primary btn-sm">
              Manage & Publish Courses (Admin) →
            </Link>
            {catFilter && (
              <button onClick={() => { setCatFilter(''); setPage(1); }} className="btn btn-secondary btn-sm">
                Clear Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {courses.map((course) => (
              <div key={course.id} className="course-card">
                {/* Card header */}
                <div className="course-card-header">
                  <span className="course-card-category">{catEmoji(course.category_name)} {course.category_name || 'General'}</span>
                </div>

                {/* Card body */}
                <div className="course-card-body">
                  <h3 className="course-card-title">{course.title}</h3>
                  <p className="course-card-desc">
                    {course.description
                      ? (course.description.length > 100 ? course.description.slice(0, 100) + '…' : course.description)
                      : 'No description available.'}
                  </p>
                  {course.instructors?.length > 0 && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      👨‍🏫 {course.instructors.join(', ')}
                    </div>
                  )}
                </div>

                {/* Card footer */}
                <div className="course-card-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    <Layers size={13} /> {course.total_lessons} lesson{course.total_lessons !== 1 ? 's' : ''}
                  </div>
                  <Link to={`/courses/${course.id}`} className="btn btn-primary btn-sm">
                    <span>Explore</span><ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-secondary btn-sm">← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-secondary'}`}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-secondary btn-sm">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
