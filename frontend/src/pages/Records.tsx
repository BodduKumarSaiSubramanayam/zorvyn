import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { recordsApi } from '../services/api';
import { Plus, Trash2, Edit2, X, Check, Search, SlidersHorizontal, RefreshCw } from 'lucide-react';

interface Record { id: string; amount: number; type: string; category: string; date: string; notes?: string; }

const CATEGORIES = ['Salary','Rent','Utilities','Marketing','Freelance','Investment','Food','Travel','Healthcare','Other'];
const emptyForm  = { amount: '', type: 'INCOME', category: 'Salary', date: new Date().toISOString().slice(0, 10), notes: '' };

export const Records = () => {
  const { user }  = useAuth();
  const isAdmin   = user?.role === 'ADMIN';

  const [records, setRecords]   = useState<Record[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [editRec, setEditRec]   = useState<Record | null>(null);
  const [search, setSearch]     = useState('');
  const [filterType, setFilter] = useState('');
  const [toast, setToast]       = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [form, setForm]         = useState(emptyForm);
  const [saving, setSaving]     = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterType) params.type = filterType;
      const res = await recordsApi.getAll(params);   // ← queries SQLite DB
      setRecords(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, [filterType]);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const openAdd = () => { setEditRec(null); setForm(emptyForm); setShowAdd(true); };
  const openEdit = (rec: Record) => {
    setEditRec(rec);
    setForm({ amount: String(rec.amount), type: rec.type, category: rec.category, date: rec.date.slice(0, 10), notes: rec.notes || '' });
    setShowAdd(true);
  };
  const closeModal = () => { setShowAdd(false); setEditRec(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form, amount: parseFloat(form.amount), date: new Date(form.date).toISOString() };
      if (editRec) {
        await recordsApi.update(editRec.id, body);  // ← PUT → DB update
        showToast('success', 'Record updated in database');
      } else {
        await recordsApi.create(body);              // ← POST → DB insert
        showToast('success', 'Record saved to database');
      }
      closeModal();
      fetchRecords();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this record from the database?')) return;
    try {
      await recordsApi.delete(id);                 // ← DELETE → DB remove
      showToast('success', 'Record deleted');
      fetchRecords();
    } catch {
      showToast('error', 'Delete failed');
    }
  };

  const filtered = records.filter(r =>
    r.category.toLowerCase().includes(search.toLowerCase()) ||
    (r.notes || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`alert alert-${toast.type}`} style={{ position: 'fixed', top: 24, right: 24, zIndex: 200, maxWidth: 360, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', animation: 'fadeUp 0.3s ease' }}>
          {toast.type === 'success' ? <Check size={16} /> : <X size={16} />} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Financial Records</h1>
          <p>Comprehensive history of all financial transactions</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" style={{ fontSize: '0.85rem' }} onClick={fetchRecords}>
            <RefreshCw size={14} /> Refresh
          </button>
          {isAdmin && (
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={18} /> Add Record
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass" style={{ padding: '14px 18px', marginBottom: 18, display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input-field" style={{ paddingLeft: 36, margin: 0 }} placeholder="Search by category or notes…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SlidersHorizontal size={15} color="var(--text-muted)" />
          <select className="input-field" value={filterType} onChange={e => setFilter(e.target.value)} style={{ width: 140, margin: 0 }}>
            <option value="">All Types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{filtered.length} records</span>
      </div>

      {/* Table */}
      <div className="glass" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div className="empty-state"><p>Retrieving transaction history…</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><p>No records found</p></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Notes</th>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(rec => (
                <tr key={rec.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                    {new Date(rec.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td>
                    <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 500 }}>{rec.category}</span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>{rec.notes || '—'}</td>
                  <td><span className={`badge badge-${rec.type.toLowerCase()}`}>{rec.type}</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: rec.type === 'INCOME' ? 'var(--secondary-light)' : 'var(--accent-light)' }}>
                    {rec.type === 'INCOME' ? '+' : '-'}${rec.amount.toLocaleString()}
                  </td>
                  {isAdmin && (
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button className="btn btn-ghost" style={{ padding: '7px 10px' }} onClick={() => openEdit(rec)}><Edit2 size={15} /></button>
                        <button className="btn btn-ghost" style={{ padding: '7px 10px', color: 'var(--accent)' }} onClick={() => handleDelete(rec.id)}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{editRec ? 'Edit Record' : 'New Transaction'}</h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Updates are processed in real-time</p>
              </div>
              <button className="btn btn-ghost" style={{ padding: 8 }} onClick={closeModal}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="input-group">
                  <label>Amount ($)</label>
                  <input className="input-field" type="number" step="0.01" min="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required placeholder="0.00" />
                </div>
                <div className="input-group">
                  <label>Type</label>
                  <select className="input-field" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="INCOME">Income</option>
                    <option value="EXPENSE">Expense</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="input-group">
                  <label>Category</label>
                  <select className="input-field" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Date</label>
                  <input className="input-field" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                </div>
              </div>
              <div className="input-group">
                <label>Notes (optional)</label>
                <input className="input-field" type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Brief description…" />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', justifyContent: 'center', padding: 14, opacity: saving ? 0.7 : 1 }}>
                <Check size={17} /> {saving ? 'Processing…' : editRec ? 'Save Changes' : 'Create Record'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
