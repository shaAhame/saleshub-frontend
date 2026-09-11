import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const BRANCHES = ['Prime', 'Liberty', 'Marino'];
const PAYMENT_METHODS = ['Full Cash', 'Full Bank Transfer', 'Full Card', 'Partial Payment'];
const BRANCH_BADGE = { Prime: 'badge-prime', Liberty: 'badge-liberty', Marino: 'badge-marino' };
const KNOWN_SUPPLIERS = [
  'Intouch', 'Yufliq', 'Tech Mart', 'Ishaq', 'Apple Mall',
  'Future Link', 'Future Store', 'Luxury', 'Mobo', 'Riham',
  'Present Solution', 'My Apple', 'GQ'
];

const emptyItem = () => ({
  item_description: '', serial_imei: '', invoice_value: '',
  cost: '', supplier_name: '', qty: '1'
});

const empty = (branch, date) => ({
  branch: branch || '', sale_date: date || format(new Date(), 'yyyy-MM-dd'),
  inv_no: '', acc_inv_no: '', customer_name: '', contact: '',
  payment_method: '', sales_person: '', out_status: 'NO', cashier: '',
  google_review: '', remarks: '',
  items: [emptyItem()]
});

export default function SalesEntry() {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [branch, setBranch] = useState(user?.role === 'admin' ? 'Prime' : user?.branch);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty(branch, date));
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [outModal, setOutModal] = useState(null);
  const [outSaving, setOutSaving] = useState(false);

  const fetchSales = useCallback(async () => {
    const params = { date, branch };
    const { data } = await api.get('/sales', { params });
    setSales(data);
  }, [date, branch]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const openAdd = () => {
    setForm(empty(branch, date));
    setModal(true);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await api.post('/sales', form);
      setModal(false);
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

  const handleOutStatusSave = async () => {
    setOutSaving(true);
    try {
      await api.put(`/sales/${outModal.id}`, { ...outModal.sale, out_status: outModal.out_status });
      setOutModal(null);
      fetchSales();
    } catch (err) {
      alert(err.response?.data?.error || 'Error updating');
    } finally { setOutSaving(false); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const setItem = (index, key, value) => {
    setForm(f => {
      const items = [...f.items];
      items[index] = { ...items[index], [key]: value };
      return { ...f, items };
    });
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, emptyItem()] }));

  const removeItem = (index) => {
    setForm(f => ({
      ...f,
      items: f.items.length > 1 ? f.items.filter((_, i) => i !== index) : f.items
    }));
  };

  const calcTotal = (items) =>
    items.reduce((s, i) => s + (parseFloat(i.invoice_value || 0) * parseInt(i.qty || 1)), 0);

  const ExtraInfo = ({ s }) => (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 12, paddingTop: 10, borderTop: '1px solid #E0E7FF' }}>
      {s.inv_no && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>INV No.</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{s.inv_no}</div>
        </div>
      )}
      {s.acc_inv_no && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>ACC INV No.</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{s.acc_inv_no}</div>
        </div>
      )}
      {s.cashier && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Cashier</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{s.cashier}</div>
        </div>
      )}
      {s.google_review && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Google Review</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: s.google_review === 'YES' ? '#10B981' : '#EF4444' }}>
            {s.google_review}
          </div>
        </div>
      )}
      {s.remarks && (
        <div style={{ flexBasis: '100%' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: 4 }}>Remarks</div>
          <div style={{ fontSize: 13, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, padding: '6px 10px', color: '#92400E' }}>
            📝 {s.remarks}
          </div>
        </div>
      )}
    </div>
  );

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
                  <th>Items</th>
                  <th>Total Value</th>
                  <th>Payment</th>
                  <th>Salesperson</th>
                  <th>Out</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s, i) => (
                  <React.Fragment key={s.id}>
                    <tr>
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td style={{ fontWeight: 500 }}>{s.customer_name}</td>
                      <td>{s.contact}</td>
                      <td>
                        <button onClick={() => setExpandedRow(expandedRow === s.id ? null : s.id)}
                          style={{ background: 'var(--primary-light)', border: 'none', color: 'var(--primary)', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          {s.items?.length || 0} item{s.items?.length !== 1 ? 's' : ''} {expandedRow === s.id ? '▲' : '▼'}
                        </button>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--accent)' }}>
                        Rs. {s.items ? s.items.reduce((sum, item) => sum + (parseFloat(item.invoice_value || 0) * parseInt(item.qty || 1)), 0).toLocaleString() : 0}
                      </td>
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
                          {user?.role === 'admin' && (
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => setOutModal({ id: s.id, out_status: s.out_status || 'NO', sale: s })}
                              style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                              {s.out_status === 'YES' ? '✅ OUT' : '⏳ OUT'}
                            </button>
                          )}
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(s.id)}>🗑</button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Row — always shows when clicked */}
                    {expandedRow === s.id && (
                      <tr>
                        <td colSpan={9} style={{ background: '#F8F7FF', padding: '10px 16px' }}>

                          {/* Items Table */}
                          {s.items && s.items.length > 0 ? (
                            <table style={{ width: '100%', minWidth: 'unset' }}>
                              <thead>
                                <tr>
                                  <th style={{ fontSize: 10 }}>#</th>
                                  <th style={{ fontSize: 10 }}>Item Description</th>
                                  <th style={{ fontSize: 10 }}>Serial / IMEI</th>
                                  <th style={{ fontSize: 10 }}>Qty</th>
                                  <th style={{ fontSize: 10 }}>Unit Price</th>
                                  <th style={{ fontSize: 10 }}>Total Invoice</th>
                                  <th style={{ fontSize: 10 }}>Unit Cost</th>
                                  <th style={{ fontSize: 10 }}>Total Cost</th>
                                  <th style={{ fontSize: 10 }}>Supplier</th>
                                </tr>
                              </thead>
                              <tbody>
                                {s.items.map((item, idx) => (
                                  <tr key={item.id}>
                                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{idx + 1}</td>
                                    <td style={{ fontSize: 12 }}>{item.item_description}</td>
                                    <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{item.serial_imei}</td>
                                    <td style={{ fontSize: 12, fontWeight: 700, textAlign: 'center' }}>{item.qty || 1}</td>
                                    <td style={{ fontSize: 12 }}>
                                      {item.invoice_value ? `Rs. ${Number(item.invoice_value).toLocaleString()}` : '-'}
                                    </td>
                                    <td style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>
                                      {item.invoice_value ? `Rs. ${(parseFloat(item.invoice_value) * parseInt(item.qty || 1)).toLocaleString()}` : '-'}
                                    </td>
                                    <td style={{ fontSize: 12 }}>
                                      {item.cost ? `Rs. ${Number(item.cost).toLocaleString()}` : '-'}
                                    </td>
                                    <td style={{ fontSize: 12, fontWeight: 700, color: '#EF4444' }}>
                                      {item.cost ? `Rs. ${(parseFloat(item.cost) * parseInt(item.qty || 1)).toLocaleString()}` : '-'}
                                    </td>
                                    <td style={{ fontSize: 12 }}>{item.supplier_name || '-'}</td>
                                  </tr>
                                ))}
                                <tr style={{ background: '#EEF2FF' }}>
                                  <td colSpan={5} style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>TOTAL</td>
                                  <td style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>
                                    Rs. {s.items.reduce((sum, item) => sum + (parseFloat(item.invoice_value || 0) * parseInt(item.qty || 1)), 0).toLocaleString()}
                                  </td>
                                  <td></td>
                                  <td style={{ fontSize: 12, fontWeight: 700, color: '#EF4444' }}>
                                    Rs. {s.items.reduce((sum, item) => sum + (parseFloat(item.cost || 0) * parseInt(item.qty || 1)), 0).toLocaleString()}
                                  </td>
                                  <td></td>
                                </tr>
                              </tbody>
                            </table>
                          ) : (
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: '4px 0' }}>No items recorded</p>
                          )}

                          {/* Extra Info — always shows */}
                          <ExtraInfo s={s} />

                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>➕ Add New Sale</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}>✕</button>
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
                    <select className="form-control" value={form.branch} onChange={e => set('branch', e.target.value)}>
                      {BRANCHES.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* 2. INV No. + ACC INV No. */}
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

              {/* 3. Customer + Contact */}
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

              {/* 4. Items */}
              <div style={{ border: '1.5px solid #E0E7FF', borderRadius: 10, padding: 14, marginBottom: 14, background: '#F8F7FF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    📦 Items
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
                      Total: Rs. {calcTotal(form.items).toLocaleString()}
                    </span>
                    <button type="button" onClick={addItem} className="btn btn-outline btn-sm">+ Add Item</button>
                  </div>
                </div>

                {form.items.map((item, index) => (
                  <div key={index} style={{ background: 'white', border: '1px solid #E0E7FF', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>ITEM {index + 1}</span>
                      {form.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(index)}
                          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 16, padding: 0 }}>✕</button>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Item Description</label>
                      <input className="form-control" placeholder="e.g. Apple iPhone 17 Pro Max 256GB"
                        value={item.item_description}
                        onChange={e => setItem(index, 'item_description', e.target.value)} />
                    </div>

                    <div className="grid-2">
                      <div className="form-group">
                        <label>Serial Number / IMEI</label>
                        <input className="form-control" placeholder="e.g. 350922948431888"
                          value={item.serial_imei}
                          onChange={e => setItem(index, 'serial_imei', e.target.value)}
                          style={{ fontFamily: 'monospace' }} />
                      </div>
                      <div className="form-group">
                        <label>Qty</label>
                        <input className="form-control" placeholder="1"
                          inputMode="numeric"
                          value={item.qty}
                          onChange={e => setItem(index, 'qty', e.target.value)} />
                      </div>
                    </div>

                    <div className="grid-2">
                      <div className="form-group">
                        <label>Invoice Value / Unit Price (Rs.)</label>
                        <input className="form-control" placeholder="0.00"
                          inputMode="decimal"
                          value={item.invoice_value}
                          onChange={e => setItem(index, 'invoice_value', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Cost / Unit (Rs.)</label>
                        <input className="form-control" placeholder="0.00"
                          inputMode="decimal"
                          value={item.cost}
                          onChange={e => setItem(index, 'cost', e.target.value)} />
                      </div>
                    </div>

                    {/* Summary Box */}
                    {(item.invoice_value || item.cost) && (
                      <div style={{
                        background: '#F0FDF4', border: '1px solid #86EFAC',
                        borderRadius: 8, padding: '10px 14px', marginBottom: 10,
                        display: 'flex', gap: 16, flexWrap: 'wrap'
                      }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Qty</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{item.qty || 1}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Unit Price</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                            Rs. {Number(item.invoice_value || 0).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Total Invoice</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#10B981' }}>
                            Rs. {(parseFloat(item.invoice_value || 0) * parseInt(item.qty || 1)).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Unit Cost</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                            Rs. {Number(item.cost || 0).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Total Cost</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#EF4444' }}>
                            Rs. {(parseFloat(item.cost || 0) * parseInt(item.qty || 1)).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Profit</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: ((parseFloat(item.invoice_value || 0) - parseFloat(item.cost || 0)) * parseInt(item.qty || 1)) >= 0 ? '#10B981' : '#EF4444' }}>
                            Rs. {((parseFloat(item.invoice_value || 0) - parseFloat(item.cost || 0)) * parseInt(item.qty || 1)).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Supplier */}
                    <div style={{ borderTop: '1px dashed #E0E7FF', paddingTop: 10, marginTop: 4 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', marginBottom: 8 }}>
                        📦 Outside Purchase? (Optional)
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Supplier Name</label>
                        <input
                          className="form-control"
                          placeholder="Type or select supplier..."
                          list={`supplier-list-${index}`}
                          value={item.supplier_name}
                          onChange={e => setItem(index, 'supplier_name', e.target.value)}
                        />
                        <datalist id={`supplier-list-${index}`}>
                          {KNOWN_SUPPLIERS.map(s => <option key={s} value={s} />)}
                        </datalist>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 5. Payment + Salesperson + Out Status + Cashier */}
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

              <div className="form-group">
                <label>Remarks</label>
                <textarea className="form-control" rows={2} value={form.remarks}
                  onChange={e => set('remarks', e.target.value)} />
              </div>

            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
                {saving ? 'Saving...' : '✅ Add Sale'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Out Status Modal — Admin Only */}
      {outModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <h3>📦 Update Out Status</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setOutModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Customer</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{outModal.sale.customer_name}</div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Items</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {outModal.sale.items?.map(i => i.item_description).join(', ')}
                </div>
              </div>
              <div className="form-group">
                <label>Out Status</label>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button
                    onClick={() => setOutModal(m => ({ ...m, out_status: 'NO' }))}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 10, border: '2px solid',
                      cursor: 'pointer', fontWeight: 700, fontSize: 15,
                      borderColor: outModal.out_status === 'NO' ? '#EF4444' : '#E5E7EB',
                      background: outModal.out_status === 'NO' ? '#FEE2E2' : 'white',
                      color: outModal.out_status === 'NO' ? '#991B1B' : '#6B7280'
                    }}>
                    ❌ NO
                  </button>
                  <button
                    onClick={() => setOutModal(m => ({ ...m, out_status: 'YES' }))}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 10, border: '2px solid',
                      cursor: 'pointer', fontWeight: 700, fontSize: 15,
                      borderColor: outModal.out_status === 'YES' ? '#10B981' : '#E5E7EB',
                      background: outModal.out_status === 'YES' ? '#D1FAE5' : 'white',
                      color: outModal.out_status === 'YES' ? '#065F46' : '#6B7280'
                    }}>
                    ✅ YES
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setOutModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleOutStatusSave} disabled={outSaving} style={{ flex: 1 }}>
                {outSaving ? 'Saving...' : '💾 Save'}
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
