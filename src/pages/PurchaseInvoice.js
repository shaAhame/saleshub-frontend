import React, { useState } from 'react';
import { format } from 'date-fns';
import api from '../utils/api';

const BRANCHES = ['Prime', 'Liberty', 'Marino'];

export default function PurchaseInvoice() {
  const [mode, setMode] = useState('date');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [from, setFrom] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [branch, setBranch] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generatingSupplier, setGeneratingSupplier] = useState('');

  const quickRanges = [
    { label: 'Today', from: format(new Date(), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') },
    { label: 'This Week', from: format(new Date(new Date().setDate(new Date().getDate() - new Date().getDay())), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') },
    { label: 'This Month', from: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') },
    { label: 'Last Month', from: format(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), 'yyyy-MM-dd'), to: format(new Date(new Date().getFullYear(), new Date().getMonth(), 0), 'yyyy-MM-dd') },
    { label: 'Last 7 Days', from: format(new Date(new Date().setDate(new Date().getDate() - 7)), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') },
    { label: 'Last 30 Days', from: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (mode === 'date') params.date = date;
      else { params.from = from; params.to = to; }
      if (branch) params.branch = branch;
      const { data: res } = await api.get('/purchase-invoice', { params });
      setData(res);
    } catch (err) {
      alert('Error loading data');
    } finally { setLoading(false); }
  };

  const getParams = () => {
    const p = new URLSearchParams();
    if (mode === 'date') p.set('date', date);
    else { p.set('from', from); p.set('to', to); }
    if (branch) p.set('branch', branch);
    return p;
  };

  const downloadFile = async (url, filename) => {
    const token = localStorage.getItem('token');
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const downloadAll = async () => {
    setGeneratingAll(true);
    try {
      const base = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      const dateLabel = mode === 'date' ? date : `${from}_to_${to}`;
      const supplierCount = Object.keys(supplierGroups).length;
      const filename = supplierCount === 1
        ? `${Object.keys(supplierGroups)[0].replace(/[^a-zA-Z0-9]/g, '_')}_invoice_${dateLabel}.docx`
        : `purchase_invoices_${dateLabel}.zip`;
      await downloadFile(`${base}/purchase-invoice/word?${getParams()}`, filename);
    } catch { alert('Error generating files'); }
    finally { setGeneratingAll(false); }
  };

  const downloadSingle = async (supplierName) => {
    setGeneratingSupplier(supplierName);
    try {
      const base = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      const dateLabel = mode === 'date' ? date : `${from}_to_${to}`;
      const safeName = supplierName.replace(/[^a-zA-Z0-9]/g, '_');
      await downloadFile(
        `${base}/purchase-invoice/word/${encodeURIComponent(supplierName)}?${getParams()}`,
        `${safeName}_invoice_${dateLabel}.docx`
      );
    } catch { alert('Error generating invoice'); }
    finally { setGeneratingSupplier(''); }
  };

  const supplierGroups = data ? data.reduce((acc, row) => {
    const key = row.supplier_name;
    if (!acc[key]) acc[key] = { items: [], totalCost: 0 };
    acc[key].items.push(row);
    acc[key].totalCost += parseFloat(row.cost || 0) * parseInt(row.qty || 1);
    return acc;
  }, {}) : {};

  const grandTotal = Object.values(supplierGroups).reduce((s, g) => s + g.totalCost, 0);
  const supplierCount = Object.keys(supplierGroups).length;

  return (
    <div>
      <div className="flex items-center gap-3" style={{ marginBottom: 24 }}>
        <div>
          <h2>🧾 Purchase Invoice</h2>
          <p className="text-muted text-sm" style={{ marginTop: 2 }}>
            Generate supplier-wise purchase invoices — Admin only
          </p>
        </div>
        {data && data.length > 0 && (
          <button className="btn btn-primary ml-auto" onClick={downloadAll} disabled={generatingAll}>
            {generatingAll ? '⏳ Generating...' : supplierCount === 1 ? '📄 Download Invoice' : `📦 Download All (${supplierCount} files)`}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['date', 'range'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                padding: '7px 18px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: 13,
                background: mode === m ? 'var(--primary)' : '#F3F4F6',
                color: mode === m ? 'white' : 'var(--text)'
              }}>
                {m === 'date' ? '📅 Single Day' : '📆 Date Range'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {mode === 'date' ? (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Date</label>
                <input type="date" className="form-control" style={{ width: 180 }}
                  value={date} onChange={e => setDate(e.target.value)} />
              </div>
            ) : (
              <>
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
              </>
            )}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Branch</label>
              <select className="form-control" style={{ width: 140 }}
                value={branch} onChange={e => setBranch(e.target.value)}>
                <option value="">All Branches</option>
                {BRANCHES.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={fetchData} disabled={loading}>
              {loading ? '⏳ Loading...' : '🔍 Preview'}
            </button>
          </div>

          {mode === 'range' && (
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
          )}
        </div>
      </div>

      {!data && !loading && (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: 40 }}>🧾</div>
            <p style={{ fontWeight: 600, marginTop: 8 }}>Select date and click Preview</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Only items with supplier and cost will appear</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: 36 }}>⏳</div>
            <p style={{ fontWeight: 600, marginTop: 8 }}>Loading...</p>
          </div>
        </div>
      )}

      {data && !loading && (
        <>
          {data.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div style={{ fontSize: 36 }}>📭</div>
                <p>No outside purchases found for selected date/range.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="card" style={{ marginBottom: 20, border: '1.5px solid #4F46E5' }}>
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#4F46E5' }}>{supplierCount}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Suppliers</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#4F46E5' }}>{data.length}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Items</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#EF4444' }}>Rs. {grandTotal.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Purchase Cost</div>
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <button className="btn btn-primary" onClick={downloadAll} disabled={generatingAll}
                      style={{ fontSize: 14, padding: '10px 24px' }}>
                      {generatingAll ? '⏳ Generating...' : supplierCount === 1 ? '📄 Download Invoice' : `📦 Download All as ZIP (${supplierCount} files)`}
                    </button>
                  </div>
                </div>
              </div>

              {/* Per Supplier Cards */}
              {Object.entries(supplierGroups).map(([supplierName, group]) => (
                <div key={supplierName} className="card" style={{ marginBottom: 16 }}>
                  <div className="card-header">
                    <div>
                      <h3>🏭 {supplierName}</h3>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 16, color: '#EF4444', fontWeight: 800 }}>
                          Rs. {group.totalCost.toLocaleString()}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Cost</div>
                      </div>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => downloadSingle(supplierName)}
                        disabled={generatingSupplier === supplierName}
                        style={{ whiteSpace: 'nowrap' }}>
                        {generatingSupplier === supplierName ? '⏳...' : '📄 Download'}
                      </button>
                    </div>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>No</th>
                          <th>Date</th>
                          <th>Branch</th>
                          <th>Item Description</th>
                          <th>Serial / IMEI</th>
                          <th>Qty</th>
                          <th>Unit Cost</th>
                          <th>Total Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>{item.sale_date ? format(new Date(item.sale_date), 'dd/MM/yyyy') : ''}</td>
                            <td><span className={`badge badge-${item.branch?.toLowerCase()}`}>{item.branch}</span></td>
                            <td>{item.item_description}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{item.serial_imei}</td>
                            <td style={{ textAlign: 'center', fontWeight: 700 }}>{item.qty || 1}</td>
                            <td>Rs. {Number(item.cost).toLocaleString()}</td>
                            <td style={{ fontWeight: 700, color: '#EF4444' }}>
                              Rs. {(parseFloat(item.cost) * parseInt(item.qty || 1)).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        <tr style={{ background: '#FEF2F2' }}>
                          <td colSpan={7} style={{ fontWeight: 700, color: '#991B1B', textAlign: 'right' }}>
                            TOTAL — {supplierName}
                          </td>
                          <td style={{ fontWeight: 800, color: '#991B1B' }}>
                            Rs. {group.totalCost.toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {/* Grand Total */}
              <div className="card" style={{ border: '2px solid #1E1B4B', marginBottom: 20 }}>
                <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#1E1B4B' }}>
                    GRAND TOTAL — {supplierCount} Suppliers — {data.length} Items
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#EF4444' }}>
                    Rs. {grandTotal.toLocaleString()}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
