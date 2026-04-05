import { useEffect, useState } from 'react';
import { usersApi } from '../services/api';
import { ShieldAlert, UserCheck, UserX, Check, X, RefreshCw, Users2 } from 'lucide-react';

interface UserType { id: string; email: string; role: string; status: string; createdAt: string; }

export const Users = () => {
  const [users, setUsers]     = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await usersApi.getAll();    // ← queries users table in SQLite
      setUsers(res.data.users);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const updateUser = async (id: string, data: { role?: string; status?: string }) => {
    try {
      await usersApi.update(id, data);        // ← PATCH → DB update
      showToast('success', `User ${Object.keys(data)[0]} updated in database`);
      fetchUsers();
    } catch {
      showToast('error', 'Update failed');
    }
  };

  const roleIcon: Record<string, React.ReactNode> = {
    ADMIN:   <ShieldAlert size={16} color="var(--primary-light)" />,
    ANALYST: <UserCheck  size={16} color="#fbbf24" />,
    VIEWER:  <UserCheck  size={16} color="var(--text-muted)" />,
  };

  const roleCounts = { ADMIN: 0, ANALYST: 0, VIEWER: 0 };
  users.forEach(u => { if (u.role in roleCounts) (roleCounts as any)[u.role]++; });

  return (
    <div>
      {toast && (
        <div className={`alert alert-${toast.type}`} style={{ position: 'fixed', top: 24, right: 24, zIndex: 200, maxWidth: 380, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', animation: 'fadeUp 0.3s ease' }}>
          {toast.type === 'success' ? <Check size={15} /> : <X size={15} />} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>User Management</h1>
          <p>Control team access levels and account status in real-time</p>
        </div>
        <button className="btn btn-outline" style={{ fontSize: '0.85rem' }} onClick={fetchUsers}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Role Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {(['ADMIN','ANALYST','VIEWER'] as const).map(role => (
          <div key={role} className="glass" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {roleIcon[role]}
              <div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8 }}>{role}</p>
                <p style={{ fontSize: '1.6rem', fontWeight: 700, lineHeight: 1.1 }}>{roleCounts[role]}</p>
              </div>
            </div>
            <Users2 size={28} style={{ opacity: 0.06 }} />
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="glass" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div className="empty-state"><p>Loading team synchronization…</p></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--primary-hover))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                        {u.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>{u.email}</p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ID: {u.id.slice(0, 8)}…</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select
                      className="input-field"
                      value={u.role}
                      onChange={e => updateUser(u.id, { role: e.target.value })}
                      style={{ width: 130, margin: 0, padding: '8px 10px', fontSize: '0.84rem' }}
                    >
                      <option value="VIEWER">VIEWER</option>
                      <option value="ANALYST">ANALYST</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td><span className={`badge badge-${u.status.toLowerCase()}`}>{u.status}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                    {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className={`btn ${u.status === 'ACTIVE' ? 'btn-danger' : 'btn-success'}`}
                      style={{ fontSize: '0.8rem', padding: '8px 14px' }}
                      onClick={() => updateUser(u.id, { status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
                    >
                      {u.status === 'ACTIVE'
                        ? <><UserX size={14} /> Deactivate</>
                        : <><Check size={14} /> Activate</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
