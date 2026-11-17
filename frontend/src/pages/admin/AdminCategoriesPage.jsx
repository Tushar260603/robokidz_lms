import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/endpoints';
import Loader from '../../components/Loader';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCategories();
      setCategories(res.data);
    } catch (err) {
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingCategory) {
        await adminApi.updateCategory(editingCategory.id, name);
        setSuccess('Category updated successfully');
      } else {
        await adminApi.createCategory(name);
        setSuccess('Category created successfully');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    setError('');
    try {
      await adminApi.deleteCategory(id);
      setSuccess('Category deleted successfully');
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete category');
    }
  };

  const totalPages = Math.ceil(categories.length / pageSize);
  const paginatedCategories = categories.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div className="page-header">
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>🏷️ Course Categories</h1>
            <p>Organize LMS courses by domain and topic</p>
          </div>
          <button type="button" onClick={handleOpenCreate} className="btn btn-accent" style={{ position: 'relative', zIndex: 2, cursor: 'pointer' }}>
            <Plus size={16} />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      {loading ? (
        <Loader text="Loading categories..." />
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th>Category Name</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCategories.length > 0 ? (
                paginatedCategories.map((cat) => (
                  <tr key={cat.id}>
                    <td>#{cat.id}</td>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Tag size={16} color="var(--primary)" />
                        <span>{cat.name}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleOpenEdit(cat)} className="btn btn-secondary btn-sm" title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="btn btn-danger btn-sm" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No categories found.</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
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
                Showing <strong>{((page - 1) * pageSize) + 1}</strong> - <strong>{Math.min(page * pageSize, categories.length)}</strong> of <strong>{categories.length}</strong> categories
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

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
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
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn btn-secondary btn-sm"
                  style={{ opacity: page === totalPages ? 0.5 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCategory ? 'Edit Category' : 'New Category'}>
        <form onSubmit={handleSaveCategory}>
          <div className="form-group">
            <label className="form-label">Category Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Artificial Intelligence"
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingCategory ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
