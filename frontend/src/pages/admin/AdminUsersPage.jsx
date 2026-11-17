import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/endpoints';
import Loader from '../../components/Loader';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import { UserPlus, Search, Edit2, Trash2, Power } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'student', bio: '' });

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 10 };
      if (roleFilter) params.role = roleFilter;
      if (search.trim()) params.search = search.trim();
      const res = await adminApi.getUsers(params);
      setUsers(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'student', bio: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, password: '', role: user.role, bio: user.bio || '' });
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingUser) {
        const updatePayload = { name: formData.name, email: formData.email, bio: formData.bio };
        if (formData.password) updatePayload.password = formData.password;
        await adminApi.updateUser(editingUser.id, updatePayload);
        setSuccess('User updated successfully');
      } else {
        await adminApi.createUser(formData);
        setSuccess('User created successfully');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save user');
    }
  };

  const handleToggleStatus = async (user) => {
    setError('');
    try {
      await adminApi.setUserStatus(user.id, !user.is_active);
      setSuccess(`User ${user.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setError('');
    try {
      const res = await adminApi.deleteUser(id);
      setSuccess(res.data.detail || 'User deleted successfully');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>👥 Users Management</h1>
            <p>Manage student and instructor accounts</p>
          </div>
          <button type="button" onClick={handleOpenCreate} className="btn btn-accent" style={{ position: 'relative', zIndex: 2, cursor: 'pointer' }}>
            <UserPlus size={16} />
            <span>Add User</span>
          </button>
        </div>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '250px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by name or email..."
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
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <Loader text="Loading users..." />
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge badge-${u.role === 'admin' ? 'danger' : u.role === 'instructor' ? 'warning' : 'info'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${u.is_active ? 'success' : 'danger'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {u.role === 'admin' ? (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Protected
                        </span>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleOpenEdit(u)} className="btn btn-secondary btn-sm" title="Edit">
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className="btn btn-secondary btn-sm"
                            title={u.is_active ? 'Deactivate' : 'Activate'}
                          >
                            <Power size={14} color={u.is_active ? '#dc2626' : '#16a34a'} />
                          </button>
                          <button onClick={() => handleDeleteUser(u.id)} className="btn btn-danger btn-sm" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No users found.</td>
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
                Showing <strong>{((page - 1) * 10) + 1}</strong> - <strong>{Math.min(page * 10, total)}</strong> of <strong>{total}</strong> users
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

      {/* Create / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'Edit User' : 'Add New User'}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          {editingUser
            ? 'Update the details for this account.'
            : 'Fill in the information below to create a new Student or Instructor account.'}
        </p>

        <form onSubmit={handleSaveUser}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. John Doe"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. john@example.com"
              required
            />
          </div>

          {!editingUser && (
            <div className="form-group">
              <label className="form-label">Account Role</label>
              <select
                className="form-select"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                style={{ fontWeight: 600 }}
              >
                <option value="student">🎓 Student (Can enroll & take courses)</option>
                <option value="instructor">👨‍🏫 Instructor (Can create & manage course content)</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              Password {editingUser ? '(Leave blank to keep unchanged)' : '(Min. 8 characters)'}
            </label>
            <input
              type="password"
              className="form-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={editingUser ? '••••••••' : 'Minimum 8 characters'}
              required={!editingUser}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Bio (Optional)</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Brief description or background..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
