import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const BRANCHES = ['Prime', 'Liberty', 'Marino'];
const PAYMENT_METHODS = ['Full Cash', 'Full Bank Transfer', 'Full Card', 'Partial Payment'];
const BRANCH_BADGE = { Prime: 'badge-prime', Liberty: 'badge-liberty', Marino: 'badge-marino' };

const empty = (branch, date) => ({
  branch: branch || '', sale_date: date || format(new Date(), 'yyyy-MM-dd'),
  customer_name: '', contact: '', item_description: '', serial_imei: '',
  acc_inv_no: '', inv_no: '', supplier_name: '', cost: '',
  invoice_value: '', payment_method: '', sales_person: '', out_status: 'NO',
  remarks: '', cashier: '', google_review: ''
});

export default function SalesEntry() {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [branch, setBranch] = useState(user?.role === 'admin' ? 'Prime' : user?.branch);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty(branch, date));
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showSupplier, setShowSupplier] = useState(false);

  const fetchSales = useCallback(async () => {
    const params = { date, branch };
    const { data } = await api.get('/sales', { params });
    setSales(data);
  }, [date, branch]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const openAdd = () => {
    setForm(empty(branch, date));
    setShowSupplier(false);
    setEditId(null);
    setModal('add');
  };

  const openEdit = (sale) => {
    setForm({
      ...sale,
      sale_date: sale.sale_date ? format(new Date(sale.sale_date), 'yyyy-MM-dd') : date,
      cost: sale.cost || '', invoice_value: sale.invoice_value || ''
    });
    setShowSupplier(!!(sale.supplier_name || sale.cost));
    setEditId(sale.id);
    setModal('edit');
  };

  const handleSave = async () => {
    if (!form.serial_imei) return alert('Serial Number / IMEI is required');
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
  const Required = () => <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>;

  return (
    <div>
      <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
        <div>
          <h2>📝 Sales Entry</h2>
          <p className="text-muted text-sm" style={{ marginTop: 2 }}>Daily sales records</p>
        </div>
        <button className="btn btn-primary ml-auto" onClick={openAdd} style={{ whiteSpace: 'nowrap' }}>+ Add Sale</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>DATE</label>
              <input type="date" className="form-control" style={{ width: 150 }}
                value={date} onChange={e => setDate(e.target.value)} />
            </div>
            {user?.role === 'admin' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>BRANCH</label>
                <select className="form-control" style={{ width: 130 }}
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
            {date ? format(new Date(date + 'T00:00:00'), 'MMM d, yyyy') : 'All Dates'}
          </h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sales.length} entries</span>
        </div>
        <div className="table-wrap">
          {sales.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 36 }}>📋</div>
              <p>No entries yet. Tap "+ Add Sale"</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Item</th>
                  <th>IMEI</th>
                  <th>Value</th>
                  <th>Payment</th>
                  <th>Salesperson</th>
                  <th>Out</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{s.customer_name}</td>
                    <td>{s.contact}</td>
                    <td>{s.item_description}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{s.serial_imei}</td>
                    <td style={{ fontWeight: 600 }}>{s.invoice_value ? `Rs. ${Number(s.invoice_value).toLocaleString()}` : ''}</td>
                    <td>{s.payment_method}</td>
                    <td>{s.sales_person}</td>
                    <td>
                      <span style={{
                        background: s.out_status === 'YES' ? '#D1FAE5' : '#FEE2E2',
                        color: s.out_status === 'YES' ? '#065F46' : '#991B1B',
                        padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700
                      }}>{s.out_status || 'NO'}</span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(s)}>✏️</button>
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

              {/* 1. Date + Branch */}
              <div className="grid-2">
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" className="form-control" value={form.sale_date}
                    onChange={e => set('sale_date', e.target.value)} />
                </div>
                {user?.role === 'admin' && (
                  <div className="form-group">
                    <label>Branch</label>
                    <select className="form-control" value={form.branch}
                      onChange={e => set('branch', e.target.value)}>
                      {BRANCHES.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* 2. INV No. + ACC INV No. — top */}
              <div className="grid-2">
                <div className="form-group">
                  <label>INV No.</label>
                  <input className="form-control" value={form.inv_no}
                    onChange={e => set('inv_no', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>ACC INV No.</label>
                  <input className="form-control" value={form.acc_inv_no}
                    onChange={e => set('acc_inv_no', e.target.value)} />
                </div>
              </div>

              {/* 3. Customer Name + Contact */}
              <div className="grid-2">
                <div className="form-group">
                  <label>Customer Name</label>
                  <input className="form-control" placeholder="Full name"
                    value={form.customer_name} onChange={e => set('customer_name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Contact</label>
                  <input className="form-control" placeholder="Phone number"
                    value={form.contact} onChange={e => set('contact', e.target.value)} />
                </div>
              </div>

              {/* 4. Item Description */}
              <div className="form-group">
                <label>Item Description</label>
                <input className="form-control" placeholder="e.g. Apple iPhone 17 Pro Max 256GB"
                  value={form.item_description} onChange={e => set('item_description', e.target.value)} />
              </div>

              {/* 5. IMEI — Only Required Field */}
              <div style={{ background: '#F8F7FF', border: '1.5px solid #E0E7FF', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Serial Number / IMEI <Required /></label>
                  <input className="form-control" placeholder="e.g. 350922948431888"
                    value={form.serial_imei} onChange={e => set('serial_imei', e.target.value)}
                    style={{ fontFamily: 'monospace' }} />
                </div>
              </div>

              {/* 6. Payment + Salesperson + Out Status + Cashier */}
              <div className="grid-2">
                <div className="form-group">
                  <label>Payment Method</label>
                  <select className="form-control" value={form.payment_method}
                    onChange={e => set('payment_method', e.target.value)}>
                    <option value="">Select...</option>
                    {PAYMENT_METHODS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Sales Person</label>
                  <input className="form-control" placeholder="Name"
                    value={form.sales_person} onChange={e => set('sales_person', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Out Status</label>
                  {user?.role === 'admin' ? (
                    <select className="form-control" value={form.out_status}
                      onChange={e => set('out_status', e.target.value)}>
                      <option value="NO">NO</option>
                      <option value="YES">YES</option>
                    </select>
                  ) : (
                    <input className="form-control" value="NO" disabled
                      style={{ background: '#F3F4F6', color: '#9CA3AF', cursor: 'not-allowed' }} />
                  )}
                </div>
                <div className="form-group">
                  <label>Cashier</label>
                  <input className="form-control" value={form.cashier}
                    onChange={e => set('cashier', e.target.value)} />
                </div>

                {/* 7. Invoice Value — after Cashier */}
                <div className="form-group">
                  <label>Invoice Value (Rs.)</label>
                  <input type="number" className="form-control" placeholder="0.00"
                    value={form.invoice_value} onChange={e => set('invoice_value', e.target.value)} />
                </div>

                <div className="form-group">
                  <label>Google Review</label>
                  <select className="form-control" value={form.google_review}
                    onChange={e => set('google_review', e.target.value)}>
                    <option value="">Select...</option>
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                  </select>
                </div>
              </div>

              {/* 8. Remarks */}
              <div className="form-group">
                <label>Remarks</label>
                <textarea className="form-control" rows={2} value={form.remarks}
                  onChange={e => set('remarks', e.target.value)} />
              </div>

              {/* 9. Outside Purchase Toggle */}
              <div style={{ border: '1.5px solid #FDE68A', borderRadius: 10, padding: 14, background: '#FFFBEB' }}>
                <div className="flex items-center gap-2" style={{ marginBottom: showSupplier ? 12 : 0 }}>
                  <input type="checkbox" id="supplierToggle" checked={showSupplier}
                    onChange={e => setShowSupplier(e.target.checked)}
                    style={{ width: 18, height: 18, cursor: 'pointer' }} />
                  <label htmlFor="supplierToggle" style={{ fontSize: 12, fontWeight: 700, color: '#92400E', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    📦 Outside Purchase? (Supplier & Cost)
                  </label>
                </div>
                {showSupplier && (
                  <div className="grid-2" style={{ marginTop: 12 }}>
                    <div className="form-group">
                      <label>Supplier Name</label>
                      <input className="form-control" placeholder="Supplier name"
                        value={form.supplier_name} onChange={e => set('supplier_name', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Cost (Rs.)</label>
                      <input type="number" className="form-control" placeholder="0.00"
                        value={form.cost} onChange={e => set('cost', e.target.value)} />
                    </div>
                  </div>
                )}
              </div>

            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
                {saving ? 'Saving...' : modal === 'add' ? '✅ Add Sale' : '💾 Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header"><h3>🗑 Confirm Delete</h3></div>
            <div className="modal-body">
              <p>Are you sure you want to delete this record? This cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
