import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const BRANCHES = ['Prime', 'Liberty', 'Marino'];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(null); // 'add' | 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', role: 'manager', branch: 'Prime' });
  const [editForm, setEditForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchUsers = async () => {
    const { data } = await api.get('/auth/users');
    setUsers(data);
  };

  useEffect(() => { fetchUsers(); }, []);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAdd = async () => {
    if (!form.username || !form.password) return alert('Username and password required');
    setSaving(true);
    try {
      await api.post('/auth/users', form);
      setModal(null);
      setForm({ username: '', password: '', role: 'manager', branch: 'Prime' });
      fetchUsers();
      showMessage('User created successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating user');
    } finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (!editForm.username) return alert('Username is required');
    if (editForm.password && editForm.password !== editForm.confirmPassword)
      return alert('Passwords do not match');
    setSaving(true);
    try {
      // Update username
      await api.put(`/auth/users/${selectedUser.id}`, {
        username: editForm.username,
        password: editForm.password || undefined
      });
      setModal(null);
      fetchUsers();
      showMessage('User updated successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Error updating user');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    try {
      await api.delete(`/auth/users/${id}`);
      fetchUsers();
      showMessage('User deleted.', 'error');
    } catch (err) {
      alert(err.response?.data?.error || 'Error deleting user');
    }
  };

  const openEdit = (user) => {
    setSelectedUser(user);
    setEditForm({ username: user.username, password: '', confirmPassword: '' });
    setModal('edit');
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setE = (k, v) => setEditForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      {/* Toast Message */}
      {message && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 2000,
          background: message.type === 'success' ? '#D1FAE5' : '#FEE2E2',
          color: message.type === 'success' ? '#065F46' : '#991B1B',
          border: `1.5px solid ${message.type === 'success' ? '#6EE7B7' : '#FECACA'}`,
          padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 13,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          {message.type === 'success' ? '✅' : '🗑'} {message.text}
        </div>
      )}

      <div className="flex items-center" style={{ marginBottom: 24 }}>
        <div>
          <h2>👥 User Management</h2>
          <p className="text-muted text-sm" style={{ marginTop: 2 }}>Manage branch managers and admin accounts</p>
        </div>
        <button className="btn btn-primary ml-auto" onClick={() => setModal('add')}>+ Add User</button>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Branch</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>👤 {u.username}</td>
                  <td>
                    <span style={{
                      background: u.role === 'admin' ? '#EFF6FF' : '#F0FDF4',
                      color: u.role === 'admin' ? '#1D4ED8' : '#15803D',
                      padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600
                    }}>
                      {u.role === 'admin' ? '⚡ Admin' : '🏪 Manager'}
                    </span>
                  </td>
                  <td>{u.branch || <span style={{ color: 'var(--text-muted)' }}>All Branches</span>}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(u)}>
                        ✏️ Edit
                      </button>
                      {u.role !== 'admin' && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>
                          🗑 Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {modal === 'add' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3>➕ Add New User</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Username</label>
                <input className="form-control" placeholder="e.g. manager_prime"
                  value={form.username} onChange={e => set('username', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" className="form-control" placeholder="Set a strong password"
                  value={form.password} onChange={e => set('password', e.target.value)} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Role</label>
                  <select className="form-control" value={form.role} onChange={e => set('role', e.target.value)}>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {form.role === 'manager' && (
                  <div className="form-group">
                    <label>Branch</label>
                    <select className="form-control" value={form.branch} onChange={e => set('branch', e.target.value)}>
                      {BRANCHES.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
                {saving ? 'Creating...' : '✅ Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {modal === 'edit' && selectedUser && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3>✏️ Edit User — {selectedUser.username}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#F8F7FF', border: '1.5px solid #E0E7FF', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>
                <strong>Role:</strong> {selectedUser.role === 'admin' ? '⚡ Admin' : '🏪 Manager'} &nbsp;|&nbsp;
                <strong>Branch:</strong> {selectedUser.branch || 'All Branches'}
              </div>

              <div className="form-group">
                <label>Username</label>
                <input className="form-control" placeholder="Username"
                  value={editForm.username} onChange={e => setE('username', e.target.value)} />
              </div>

              <div style={{ borderTop: '1px solid var(--border)', margin: '16px 0', paddingTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>
                  🔐 Change Password (leave blank to keep current)
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input type="password" className="form-control" placeholder="Enter new password"
                    value={editForm.password} onChange={e => setE('password', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input type="password" className="form-control" placeholder="Repeat new password"
                    value={editForm.confirmPassword} onChange={e => setE('confirmPassword', e.target.value)} />
                </div>
                {editForm.password && editForm.confirmPassword && editForm.password !== editForm.confirmPassword && (
                  <div style={{ color: '#DC2626', fontSize: 12, marginTop: -8, marginBottom: 8 }}>
                    ⚠️ Passwords do not match
                  </div>
                )}
                {editForm.password && editForm.confirmPassword && editForm.password === editForm.confirmPassword && (
                  <div style={{ color: '#065F46', fontSize: 12, marginTop: -8, marginBottom: 8 }}>
                    ✅ Passwords match
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleEdit} disabled={saving}>
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
