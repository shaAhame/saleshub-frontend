import React, { useState } from 'react';
import { format } from 'date-fns';
import api from '../utils/api';

const BRANCHES = ['Prime', 'Liberty', 'Marino'];

export default function SupplierReport() {
  const [from, setFrom] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [branch, setBranch] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = { from, to };
      if (branch) params.branch = branch;
      const { data: res } = await api.get('/sales/supplier-report', { params });
      setData(res);
    } catch (err) {
      alert('Error loading report');
    } finally { setLoading(false); }
  };

  const handleExport = async (type) => {
    try {
      const params = new URLSearchParams({ from, to });
      if (branch) params.set('branch', branch);
      const token = localStorage.getItem('token');
      const url = `${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/sales/supplier-report/export/${type}?${params}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `supplier_report_${from}_to_${to}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
      link.click();
    } catch { alert('Export failed'); }
  };

  const quickRanges = [
    { label: 'Today', from: format(new Date(), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') },
    { label: 'This Week', from: format(new Date(new Date().setDate(new Date().getDate() - new Date().getDay())), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') },
    { label: 'This Month', from: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') },
    { label: 'Last Month', from: format(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), 'yyyy-MM-dd'), to: format(new Date(new Date().getFullYear(), new Date().getMonth(), 0), 'yyyy-MM-dd') },
    { label: 'Last 7 Days', from: format(new Date(new Date().setDate(new Date().getDate() - 7)), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') },
    { label: 'Last 30 Days', from: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') },
  ];

  // Group by supplier
  const supplierGroups = data ? data.reduce((acc, row) => {
    const key = row.supplier_name || 'No Supplier';
    if (!acc[key]) acc[key] = { items: [], totalCost: 0, totalInvoice: 0 };
    acc[key].items.push(row);
    acc[key].totalCost += parseFloat(row.cost || 0);
    acc[key].totalInvoice += parseFloat(row.invoice_value || 0);
    return acc;
  }, {}) : {};

  const grandTotalCost = data ? data.reduce((s, r) => s + parseFloat(r.cost || 0), 0) : 0;
  const grandTotalInvoice = data ? data.reduce((s, r) => s + parseFloat(r.invoice_value || 0), 0) : 0;
  const grandProfit = grandTotalInvoice - grandTotalCost;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3" style={{ marginBottom: 24 }}>
        <div>
          <h2>📦 Supplier Report</h2>
          <p className="text-muted text-sm" style={{ marginTop: 2 }}>Product summary by supplier — Admin only</p>
        </div>
        {data && (
          <div className="flex gap-2 ml-auto">
            <button className="btn btn-success btn-sm" onClick={() => handleExport('excel')}>⬇ Excel</button>
            <button className="btn btn-outline btn-sm" onClick={() => handleExport('pdf')}>⬇ PDF</button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>From Date</label>
              <input type="date" className="form-control" style={{ width: 160 }}
                value={from} onChange={e => setFrom(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>To Date</label>
              <input type="date" className="form-control" style={{ width: 160 }}
                value={to} onChange={e => setTo(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Branch</label>
              <select className="form-control" style={{ width: 140 }}
                value={branch} onChange={e => setBranch(e.target.value)}>
                <option value="">All Branches</option>
                {BRANCHES.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={fetchReport} disabled={loading}>
              {loading ? '⏳ Loading...' : '🔍 Generate Report'}
            </button>
          </div>

          {/* Quick Range */}
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', alignSelf: 'center' }}>QUICK:</span>
            {quickRanges.map(r => (
              <button key={r.label} onClick={() => { setFrom(r.from); setTo(r.to); }}
                style={{
                  background: from === r.from && to === r.to ? 'var(--primary)' : '#F3F4F6',
                  color: from === r.from && to === r.to ? 'white' : 'var(--text)',
                  border: 'none', padding: '5px 12px', borderRadius: 20,
                  fontSize: 12, fontWeight: 500, cursor: 'pointer'
                }}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* No data yet */}
      {!data && !loading && (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: 40 }}>📦</div>
            <p style={{ fontWeight: 600, marginTop: 8 }}>Select date range and click Generate Report</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: 36 }}>⏳</div>
            <p style={{ fontWeight: 600, marginTop: 8 }}>Generating report...</p>
          </div>
        </div>
      )}

      {/* Results */}
      {data && !loading && (
        <>
          {/* Summary Stats */}
          <div className="grid-3" style={{ marginBottom: 20 }}>
            {[
              { label: 'Total Items Purchased', value: data.length, icon: '📦', color: '#4F46E5' },
              { label: 'Total Cost', value: `Rs. ${grandTotalCost.toLocaleString()}`, icon: '💸', color: '#EF4444' },
              { label: 'Total Invoice Value', value: `Rs. ${grandTotalInvoice.toLocaleString()}`, icon: '💰', color: '#10B981' },
            ].map(s => (
              <div key={s.label} className="card">
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ fontSize: 28 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Profit Card */}
          <div className="card" style={{ marginBottom: 20, border: `1.5px solid ${grandProfit >= 0 ? '#10B981' : '#EF4444'}` }}>
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 28 }}>{grandProfit >= 0 ? '📈' : '📉'}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: grandProfit >= 0 ? '#10B981' : '#EF4444' }}>
                  Rs. {Math.abs(grandProfit).toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  {grandProfit >= 0 ? 'Total Gross Profit' : 'Total Loss'}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Period: <strong>{from}</strong> to <strong>{to}</strong>
                </div>
                {branch && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Branch: <strong>{branch}</strong></div>}
              </div>
            </div>
          </div>

          {/* Supplier Groups */}
          {Object.entries(supplierGroups).map(([supplierName, group]) => (
            <div key={supplierName} className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <div>
                  <h3>🏭 {supplierName}</h3>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, color: '#EF4444', fontWeight: 600 }}>
                    Cost: Rs. {group.totalCost.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>
                    Invoice: Rs. {group.totalInvoice.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: (group.totalInvoice - group.totalCost) >= 0 ? '#10B981' : '#EF4444', fontWeight: 700 }}>
                    Profit: Rs. {(group.totalInvoice - group.totalCost).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Date</th>
                      <th>Branch</th>
                      <th>Customer</th>
                      <th>Item Description</th>
                      <th>Serial / IMEI</th>
                      <th>Cost</th>
                      <th>Invoice Value</th>
                      <th>Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item, idx) => {
                      const profit = parseFloat(item.invoice_value || 0) - parseFloat(item.cost || 0);
                      return (
                        <tr key={idx}>
                          <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{item.sale_date ? format(new Date(item.sale_date), 'dd/MM/yyyy') : ''}</td>
                          <td><span className={`badge badge-${item.branch?.toLowerCase()}`}>{item.branch}</span></td>
                          <td style={{ fontWeight: 500 }}>{item.customer_name}</td>
                          <td>{item.item_description}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{item.serial_imei}</td>
                          <td style={{ color: '#EF4444', fontWeight: 600 }}>
                            {item.cost ? `Rs. ${Number(item.cost).toLocaleString()}` : '-'}
                          </td>
                          <td style={{ color: '#10B981', fontWeight: 600 }}>
                            {item.invoice_value ? `Rs. ${Number(item.invoice_value).toLocaleString()}` : '-'}
                          </td>
                          <td style={{ fontWeight: 700, color: profit >= 0 ? '#10B981' : '#EF4444' }}>
                            {item.cost && item.invoice_value ? `Rs. ${profit.toLocaleString()}` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Supplier Total Row */}
                    <tr style={{ background: '#F8F7FF', fontWeight: 700 }}>
                      <td colSpan={6} style={{ fontWeight: 700, color: 'var(--primary)' }}>TOTAL — {supplierName}</td>
                      <td style={{ color: '#EF4444', fontWeight: 700 }}>Rs. {group.totalCost.toLocaleString()}</td>
                      <td style={{ color: '#10B981', fontWeight: 700 }}>Rs. {group.totalInvoice.toLocaleString()}</td>
                      <td style={{ color: (group.totalInvoice - group.totalCost) >= 0 ? '#10B981' : '#EF4444', fontWeight: 700 }}>
                        Rs. {(group.totalInvoice - group.totalCost).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
