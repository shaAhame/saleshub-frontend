import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const BRANCHES = ['Prime', 'Liberty', 'Marino'];
const BRANCH_BADGE = { Prime: 'badge-prime', Liberty: 'badge-liberty', Marino: 'badge-marino' };

export default function Dashboard() {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [branch, setBranch] = useState(user?.role === 'admin' ? '' : user?.branch);
  const [imeiQuery, setImeiQuery] = useState('');
  const [imeiResult, setImeiResult] = useState(null);
  const [imeiSearched, setImeiSearched] = useState(false);
  const [imeiLoading, setImeiLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (date) params.date = date;
      if (branch) params.branch = branch;
      const { data } = await api.get('/sales', { params });
      setSales(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [date, branch]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const handleIMEISearch = async () => {
    if (!imeiQuery.trim()) return;
    setImeiLoading(true);
    setImeiSearched(false);
    setImeiResult(null);
    try {
      const { data } = await api.get('/sales', { params: { imei: imeiQuery.trim() } });
      setImeiResult(data.length > 0 ? data : []);
    } catch { setImeiResult([]); }
    finally { setImeiLoading(false); setImeiSearched(true); }
  };

  const handleExport = async (type) => {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (branch) params.set('branch', branch);
    const token = localStorage.getItem('token');
    const url = `${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/sales/export/${type}?${params}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sales_${date || 'all'}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
    link.click();
  };

  const totalValue = sales.reduce((s, r) => s + parseFloat(r.invoice_value || 0), 0);
  const totalCost = sales.reduce((s, r) => s + parseFloat(r.cost || 0), 0);

  return (
    <div>
      <div className="flex items-center gap-3" style={{ marginBottom: 24 }}>
        <div>
          <h2>📊 Sales Dashboard</h2>
          <p className="text-muted text-sm" style={{ marginTop: 2 }}>
            {user?.role === 'admin' ? 'All branches' : `${user?.branch} branch`}
          </p>
        </div>
        <div className="flex gap-2 ml-auto">
          <button className="btn btn-outline btn-sm" onClick={() => handleExport('excel')}>⬇ Excel</button>
          <button className="btn btn-outline btn-sm" onClick={() => handleExport('pdf')}>⬇ PDF</button>
        </div>
      </div>

      {/* IMEI Search */}
      <div className="card" style={{ marginBottom: 20, border: '1.5px solid #818CF8' }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🔍 Search by IMEI / Serial Number
          </div>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            <input className="form-control" style={{ maxWidth: 340, fontFamily: 'monospace' }}
              placeholder="Enter IMEI or Serial Number..."
              value={imeiQuery}
              onChange={e => { setImeiQuery(e.target.value); setImeiSearched(false); setImeiResult(null); }}
              onKeyDown={e => e.key === 'Enter' && handleIMEISearch()} />
            <button className="btn btn-primary" onClick={handleIMEISearch} disabled={imeiLoading}>
              {imeiLoading ? 'Searching...' : '🔍 Search'}
            </button>
            {imeiSearched && (
              <button className="btn btn-ghost" onClick={() => { setImeiQuery(''); setImeiResult(null); setImeiSearched(false); }}>
                ✕ Clear
              </button>
            )}
          </div>

          {imeiSearched && imeiResult !== null && (
            <div style={{ marginTop: 14 }}>
              {imeiResult.length === 0 ? (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', color: '#DC2626', fontSize: 13 }}>
                  ❌ No record found for: <strong>{imeiQuery}</strong>
                </div>
              ) : (
                imeiResult.map(r => (
                  <div key={r.id} style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 10, padding: 16, marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                      <div>
                        <span className={`badge ${BRANCH_BADGE[r.branch]}`} style={{ marginRight: 8 }}>{r.branch}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {r.sale_date ? format(new Date(r.sale_date), 'dd MMM yyyy') : ''}
                        </span>
                      </div>
                      <span style={{
                        background: r.out_status === 'YES' ? '#D1FAE5' : '#FEE2E2',
                        color: r.out_status === 'YES' ? '#065F46' : '#991B1B',
                        padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700
                      }}>Out: {r.out_status || 'NO'}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                      {[
                        { label: 'Customer Name', value: r.customer_name },
                        { label: 'Contact', value: r.contact },
                        { label: 'Item', value: r.item_description },
                        { label: 'IMEI / Serial', value: r.serial_imei },
                        { label: 'Invoice Value', value: r.invoice_value ? `Rs. ${Number(r.invoice_value).toLocaleString()}` : '-' },
                        { label: 'Payment', value: r.payment_method },
                        { label: 'Sales Person', value: r.sales_person },
                        { label: 'Cashier', value: r.cashier || '-' },
                        { label: 'Supplier', value: r.supplier_name || '-' },
                        { label: 'Cost', value: r.cost ? `Rs. ${Number(r.cost).toLocaleString()}` : '-' },
                        { label: 'ACC INV No.', value: r.acc_inv_no || '-' },
                        { label: 'INV No.', value: r.inv_no || '-' },
                        { label: 'Google Review', value: r.google_review || '-' },
                        { label: 'Remarks', value: r.remarks || '-' },
                      ].map(item => (
                        <div key={item.label} style={{ background: 'white', borderRadius: 8, padding: '8px 12px', border: '1px solid #D1FAE5' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>{item.label}</div>
                          <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
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
                  <option value="">All Branches</option>
                  {BRANCHES.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
            )}
            <button className="btn btn-primary btn-sm" onClick={fetchSales}>🔍 Filter</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setDate(''); setBranch(user?.role === 'admin' ? '' : user?.branch); }}>✕ Clear</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Sales', value: sales.length, icon: '🧾', color: '#4F46E5' },
          { label: 'Total Invoice Value', value: `Rs. ${totalValue.toLocaleString()}`, icon: '💰', color: '#10B981' },
          { label: 'Total Cost', value: `Rs. ${totalCost.toLocaleString()}`, icon: '📦', color: '#F59E0B' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 28 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <h3>Sales Records</h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sales.length} records</span>
        </div>
        <div className="table-wrap">
          {loading ? (
            <div className="empty-state"><p>Loading...</p></div>
          ) : sales.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 40 }}>📭</div>
              <p>No sales records found.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Branch</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Items</th>
                  <th>Inv. Value</th>
                  <th>Payment</th>
                  <th>Salesperson</th>
                  <th>Out</th>
                  <th>Cashier</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s, i) => (
                  <React.Fragment key={s.id}>
                    <tr>
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td><span className={`badge ${BRANCH_BADGE[s.branch]}`}>{s.branch}</span></td>
                      <td style={{ whiteSpace: 'nowrap' }}>{s.sale_date ? format(new Date(s.sale_date), 'dd/MM/yyyy') : ''}</td>
                      <td style={{ fontWeight: 500 }}>{s.customer_name}</td>
                      <td>{s.contact}</td>
                      <td>
                        <button onClick={() => setExpandedRow(expandedRow === s.id ? null : s.id)}
                          style={{ background: 'var(--primary-light)', border: 'none', color: 'var(--primary)', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          {s.items?.length || 0} item{s.items?.length !== 1 ? 's' : ''} {expandedRow === s.id ? '▲' : '▼'}
                        </button>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{s.invoice_value ? `Rs. ${Number(s.invoice_value).toLocaleString()}` : ''}</td>
                      <td><span style={{ fontSize: 11, background: '#F3F4F6', padding: '2px 7px', borderRadius: 12 }}>{s.payment_method}</span></td>
                      <td>{s.sales_person}</td>
                      <td>
                        <span style={{
                          background: s.out_status === 'YES' ? '#D1FAE5' : '#FEE2E2',
                          color: s.out_status === 'YES' ? '#065F46' : '#991B1B',
                          padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700
                        }}>{s.out_status || 'NO'}</span>
                      </td>
                      <td>{s.cashier}</td>
                    </tr>

                    {/* Expanded Items */}
                    {expandedRow === s.id && (
                      <tr>
                        <td colSpan={11} style={{ background: '#F8F7FF', padding: '8px 16px' }}>
                          {s.items && s.items.length > 0 ? (
                            <table style={{ width: '100%', minWidth: 'unset' }}>
                              <thead>
                                <tr>
                                  <th style={{ fontSize: 10 }}>#</th>
                                  <th style={{ fontSize: 10 }}>Item Description</th>
                                  <th style={{ fontSize: 10 }}>Serial / IMEI</th>
                                </tr>
                              </thead>
                              <tbody>
                                {s.items.map((item, idx) => (
                                  <tr key={item.id}>
                                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{idx + 1}</td>
                                    <td style={{ fontSize: 12 }}>{item.item_description}</td>
                                    <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{item.serial_imei}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: '4px 0' }}>No items recorded</p>
                          )}
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
    </div>
  );
}
