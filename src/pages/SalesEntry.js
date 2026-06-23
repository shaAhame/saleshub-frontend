import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const BRANCHES = ['Prime', 'Liberty', 'Marino'];
const PAYMENT_METHODS = ['Full Cash', 'Full Bank Transfer', 'Full Card', 'Partial Payment'];
const BRANCH_BADGE = { Prime: 'badge-prime', Liberty: 'badge-liberty', Marino: 'badge-marino' };

const empty = (branch, date) => ({
  branch: branch || '', sale_date: date || format(new Date(), 'yyyy-MM-dd'),
  row_number: '', customer_name: '', acc_inv_no: '', contact: '', inv_no: '',
  item_description: '', serial_imei: '', supplier_name: '', cost: '',
  invoice_value: '', payment_method: '', sales_person: '', out_status: '',
  remarks: '', cashier: '', google_review: ''
});

export default function SalesEntry() {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [branch, setBranch] = useState(user?.role === 'admin' ? 'Prime' : user?.branch);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState(empty(branch, date));
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchSales = useCallback(async () => {
    const params = { date, branch };
    const { data } = await api.get('/sales', { params });
    setSales(data);
  }, [date, branch]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const openAdd = () => {
    setForm(empty(branch, date));
    setEditId(null);
    setModal('add');
  };

  const openEdit = (sale) => {
    setForm({
      ...sale,
      sale_date: sale.sale_date ? format(new Date(sale.sale_date), 'yyyy-MM-dd') : date,
      cost: sale.cost || '', invoice_value: sale.invoice_value || ''
    });
    setEditId(sale.id);
    setModal('edit');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/sales/${editId}`, form);
      } else {
        await api.post('/sales', form);
      }
      setModal(null);
      fetchSales();
    } catch (err) {
      alert(err.response?.data?.error || 'Error saving');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/sales/${id}`);
      setDeleteConfirm(null);
      fetchSales();
    } catch (err) {
      alert(err.response?.data?.error || 'Error deleting');
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <div className="flex items-center gap-3" style={{ marginBottom: 24 }}>
        <div>
          <h2>📝 Sales Entry</h2>
          <p className="text-muted text-sm" style={{ marginTop: 2 }}>Add and manage daily sales records</p>
        </div>
        <button className="btn btn-primary ml-auto" onClick={openAdd}>+ Add Sale</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <div className="flex gap-3 items-center" style={{ flexWrap: 'wrap' }}>
            <div className="flex items-center gap-2">
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>DATE</label>
              <input type="date" className="form-control" style={{ width: 160 }}
                value={date} onChange={e => setDate(e.target.value)} />
            </div>
            {user?.role === 'admin' && (
              <div className="flex items-center gap-2">
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>BRANCH</label>
                <select className="form-control" style={{ width: 140 }}
                  value={branch} onChange={e => setBranch(e.target.value)}>
                  {BRANCHES.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <h3>
            <span className={`badge ${BRANCH_BADGE[branch]}`} style={{ marginRight: 8 }}>{branch}</span>
            {date ? format(new Date(date + 'T00:00:00'), 'MMMM d, yyyy') : 'All Dates'}
          </h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sales.length} entries</span>
        </div>
        <div className="table-wrap">
          {sales.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 40 }}>📋</div>
              <p>No entries yet. Click "+ Add Sale" to get started.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Item</th>
                  <th>Serial/IMEI</th>
                  <th>Inv. Value</th>
                  <th>Payment</th>
                  <th>Salesperson</th>
                  <th>Out</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{s.row_number || i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{s.customer_name}</td>
                    <td>{s.contact}</td>
                    <td>{s.item_description}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{s.serial_imei}</td>
                    <td style={{ fontWeight: 600 }}>{s.invoice_value ? `Rs. ${Number(s.invoice_value).toLocaleString()}` : ''}</td>
                    <td>{s.payment_method}</td>
                    <td>{s.sales_person}</td>
                    <td>{s.out_status}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(s)}>✏️ Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(s.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{modal === 'add' ? '➕ Add New Sale' : '✏️ Edit Sale'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="grid-3">
                {user?.role === 'admin' && (
                  <div className="form-group">
                    <label>Branch</label>
                    <select className="form-control" value={form.branch} onChange={e => set('branch', e.target.value)}>
                      {BRANCHES.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" className="form-control" value={form.sale_date} onChange={e => set('sale_date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Row #</label>
                  <input className="form-control" placeholder="1" value={form.row_number} onChange={e => set('row_number', e.target.value)} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Customer Name</label>
                  <input className="form-control" placeholder="Customer name" value={form.customer_name} onChange={e => set('customer_name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Contact</label>
                  <input className="form-control" placeholder="Phone number" value={form.contact} onChange={e => set('contact', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>ACC INV No.</label>
                  <input className="form-control" value={form.acc_inv_no} onChange={e => set('acc_inv_no', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>INV No.</label>
                  <input className="form-control" value={form.inv_no} onChange={e => set('inv_no', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Item Description</label>
                <input className="form-control" placeholder="e.g. Apple iPhone 15 Pro 256GB" value={form.item_description} onChange={e => set('item_description', e.target.value)} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Serial Number / IMEI</label>
                  <input className="form-control" placeholder="Enter as text" value={form.serial_imei} onChange={e => set('serial_imei', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Supplier Name</label>
                  <input className="form-control" value={form.supplier_name} onChange={e => set('supplier_name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Cost (Rs.)</label>
                  <input type="number" className="form-control" placeholder="0.00" value={form.cost} onChange={e => set('cost', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Invoice Value (Rs.)</label>
                  <input type="number" className="form-control" placeholder="0.00" value={form.invoice_value} onChange={e => set('invoice_value', e.target.value)} />
                </div>
              </div>
              <div className="grid-3">
                <div className="form-group">
                  <label>Payment Method</label>
                  <select className="form-control" value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
                    <option value="">Select...</option>
                    {PAYMENT_METHODS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Sales Person</label>
                  <input className="form-control" value={form.sales_person} onChange={e => set('sales_person', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Out Status</label>
                  <input className="form-control" placeholder="e.g. Delivered" value={form.out_status} onChange={e => set('out_status', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Cashier</label>
                  <input className="form-control" value={form.cashier} onChange={e => set('cashier', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Google Review</label>
                  <input className="form-control" placeholder="Yes / No" value={form.google_review} onChange={e => set('google_review', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Remarks</label>
                <textarea className="form-control" rows={2} value={form.remarks} onChange={e => set('remarks', e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : modal === 'add' ? '✅ Add Sale' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header"><h3>🗑 Confirm Delete</h3></div>
            <div className="modal-body">
              <p>Are you sure you want to delete this sale record? This cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
