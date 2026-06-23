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
      {/* Header */}
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

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <div className="flex gap-3 items-center" style={{ flexWrap: 'wrap' }}>
            <div className="flex items-center gap-2">
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>DATE</label>
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
            <button className="btn btn-primary btn-sm" onClick={fetchSales}>🔍 Search</button>
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
              <p>No sales records found for the selected filters.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Branch</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Item</th>
                  <th>Serial/IMEI</th>
                  <th>Supplier</th>
                  <th>Cost</th>
                  <th>Inv. Value</th>
                  <th>Payment</th>
                  <th>Salesperson</th>
                  <th>Out Status</th>
                  <th>Cashier</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{s.row_number || i + 1}</td>
                    <td><span className={`badge ${BRANCH_BADGE[s.branch]}`}>{s.branch}</span></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{s.sale_date ? format(new Date(s.sale_date), 'dd/MM/yyyy') : ''}</td>
                    <td style={{ fontWeight: 500 }}>{s.customer_name}</td>
                    <td>{s.contact}</td>
                    <td>{s.item_description}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{s.serial_imei}</td>
                    <td>{s.supplier_name}</td>
                    <td>{s.cost ? `Rs. ${Number(s.cost).toLocaleString()}` : ''}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>
                      {s.invoice_value ? `Rs. ${Number(s.invoice_value).toLocaleString()}` : ''}
                    </td>
                    <td><span style={{ fontSize: 11, background: '#F3F4F6', padding: '2px 7px', borderRadius: 12 }}>{s.payment_method}</span></td>
                    <td>{s.sales_person}</td>
                    <td>{s.out_status}</td>
                    <td>{s.cashier}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{s.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
