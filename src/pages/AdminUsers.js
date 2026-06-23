import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const BRANCHES = ['Prime', 'Liberty', 'Marino'];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', role: 'manager', branch: 'Prime' });
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    const { data } = await api.get('/auth/users');
    setUsers(data);
  };

  useEffect(() => { fetch(); }, []);

  const handleAdd = async () => {
    setSaving(true);
    try {
      await api.post('/auth/users', form);
      setModal(false);
      setForm({ username: '', password: '', role: 'manager', branch: 'Prime' });
      fetch();
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating user');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    await api.delete(`/auth/users/${id}`);
    fetch();
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <div className="flex items-center" style={{ marginBottom: 24 }}>
        <div>
          <h2>👥 User Management</h2>
          <p className="text-muted text-sm" style={{ marginTop: 2 }}>Manage branch managers and admin accounts</p>
        </div>
        <button className="btn btn-primary ml-auto" onClick={() => setModal(true)}>+ Add User</button>
      </div>

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
                  <td>{u.branch || <span style={{ color: 'var(--text-muted)' }}>All</span>}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    {u.role !== 'admin' && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>🗑 Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3>➕ Add New User</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Username</label>
                <input className="form-control" placeholder="e.g. manager_prime" value={form.username} onChange={e => set('username', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" className="form-control" placeholder="Set a strong password" value={form.password} onChange={e => set('password', e.target.value)} />
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
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
                {saving ? 'Creating...' : '✅ Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
