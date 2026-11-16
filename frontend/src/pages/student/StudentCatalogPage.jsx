import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studentApi, adminApi } from '../../api/endpoints';
import Loader from '../../components/Loader';
import Alert from '../../components/Alert';
import { Search, BookOpen, Users, ArrowRight } from 'lucide-react';

export default function StudentCatalogPage() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [page, catFilter]);

  const fetchCategories = async () => {
    try {
      const res = await adminApi.getCategories();
      setCategories(res.data);
    } catch {
      // Non-blocking
    }
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

  return (
    <div className="container">
      {/* Hero Header */}
      <div style={{ textAlign: 'center', margin: '2rem 0 3rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
          Explore Robotics & Coding Courses
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
          Master cutting-edge robotics, ROS, embedded systems, and programming with hands-on lessons.
        </p>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />

      {/* Search and Category Filter Bar */}
      <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '260px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search robotics courses, SLAM, Arduino..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            <Search size={16} />
            <span>Search</span>
          </button>
        </form>

        <select
          className="form-select"
          style={{ width: '200px' }}
          value={catFilter}
          onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Domains</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <Loader fullScreen text="Discovering courses..." />
      ) : courses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <BookOpen size={48} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>No courses found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Try adjusting your search criteria or domain filter.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {courses.map((course) => (
            <div key={course.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className="badge badge-info">{course.category_name || 'General'}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {course.total_lessons} lessons
                  </span>
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>
                  {course.title}
                </h3>

                <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1rem', minHeight: '3.5rem' }}>
                  {course.description ? (course.description.length > 110 ? course.description.slice(0, 110) + '...' : course.description) : 'No description'}
                </p>

                {course.instructors && course.instructors.length > 0 && (
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem' }}>
                    Instructors: <strong>{course.instructors.join(', ')}</strong>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <Link to={`/courses/${course.id}`} className="btn btn-primary" style={{ width: '100%' }}>
                  <span>View Details</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
