import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../services/api';
import { TrendingUp, TrendingDown, Scale, Activity, BarChart3, ArrowUpRight, RefreshCw } from 'lucide-react';

interface Summary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  categoryWise: Record<string, number>;
}
interface TrendData {
  recentActivity: any[];
  monthlyTrends: Record<string, { income: number; expenses: number }>;
}

const StatCard = ({ title, value, icon, accent, delay = 0 }: { title: string; value: number; icon: React.ReactNode; accent: string; delay?: number }) => (
  <div className="glass animate-fade-up" style={{ padding: 28, animationDelay: `${delay}ms`, opacity: 0 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${accent}28` }}>
        {icon}
      </div>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: accent, fontWeight: 600, background: `${accent}12`, padding: '4px 8px', borderRadius: 20 }}>
        <ArrowUpRight size={11} /> Live
      </span>
    </div>
    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 6 }}>{title}</p>
    <h3 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-1px', color: value < 0 ? 'var(--accent-light)' : undefined }}>
      <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: 400, marginRight: 2 }}>$</span>
      {Math.abs(value).toLocaleString()}
    </h3>
  </div>
);

export const Dashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary]   = useState<Summary | null>(null);
  const [trends, setTrends]     = useState<TrendData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [s, t] = await Promise.all([
        dashboardApi.getSummary(),   // ← hits /api/dashboard/summary → SQLite DB
        dashboardApi.getTrends(),    // ← hits /api/dashboard/trends  → SQLite DB
      ]);
      setSummary(s.data.summary);
      setTrends(t.data.data);
      setLastRefreshed(new Date());
    } catch {
      setError('Failed to load dashboard data. Is the backend running on port 3000?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'var(--text-muted)' }}>Synchronizing your data…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
      <div className="alert alert-error" style={{ maxWidth: 480 }}><span>⚠</span>{error}</div>
      <button className="btn btn-outline" onClick={fetchData}><RefreshCw size={16} /> Retry</button>
    </div>
  );

  const categories = Object.entries(summary?.categoryWise || {});
  const maxCat = Math.max(...categories.map(([, v]) => Math.abs(v)), 1);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }}>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 4 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
            Welcome, <span style={{ color: 'var(--primary-light)' }}>{user?.email.split('@')[0]}</span> 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>
            Real-time financial analytics and trends.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <button className="btn btn-ghost" style={{ fontSize: '0.82rem' }} onClick={fetchData}>
            <RefreshCw size={14} /> Refresh
          </button>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: 6 }}>
            Last synced: {lastRefreshed.toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: 20, marginBottom: 28 }}>
        <StatCard title="Total Income"   value={summary?.totalIncome || 0}   icon={<TrendingUp  size={22} color="var(--secondary)" />}     accent="var(--secondary)"     delay={0}   />
        <StatCard title="Total Expenses" value={summary?.totalExpenses || 0} icon={<TrendingDown size={22} color="var(--accent)" />}        accent="var(--accent)"        delay={80}  />
        <StatCard title="Net Balance"    value={summary?.netBalance || 0}    icon={<Scale        size={22} color="var(--primary-light)" />} accent="var(--primary-light)" delay={160} />
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent Activity */}
        <div className="glass animate-fade-up" style={{ padding: 28, animationDelay: '240ms', opacity: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Activity size={18} color="var(--primary-light)" />
            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Recent Activity</h2>
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{trends?.recentActivity.length || 0} records</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(trends?.recentActivity || []).slice(0, 7).map((rec: any) => (
              <div key={rec.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                <div>
                  <p style={{ fontWeight: 500, fontSize: '0.88rem' }}>{rec.category}</p>
                  <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {new Date(rec.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: rec.type === 'INCOME' ? 'var(--secondary-light)' : 'var(--accent-light)' }}>
                  {rec.type === 'INCOME' ? '+' : '-'}${rec.amount.toLocaleString()}
                </span>
              </div>
            ))}
            {!trends?.recentActivity.length && <div className="empty-state"><p>No transactions yet</p></div>}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="glass animate-fade-up" style={{ padding: 28, animationDelay: '320ms', opacity: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <BarChart3 size={18} color="var(--primary-light)" />
            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Category Breakdown</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {categories.map(([cat, amt]) => {
              const pct = Math.round((Math.abs(amt) / maxCat) * 100);
              const positive = amt >= 0;
              return (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{cat}</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: positive ? 'var(--secondary-light)' : 'var(--accent-light)' }}>
                      {positive ? '+' : '-'}${Math.abs(amt).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: positive ? 'linear-gradient(90deg,var(--secondary),var(--secondary-light))' : 'linear-gradient(90deg,var(--accent),var(--accent-light))', transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)' }} />
                  </div>
                </div>
              );
            })}
            {!categories.length && <div className="empty-state"><p>No category data</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
};
