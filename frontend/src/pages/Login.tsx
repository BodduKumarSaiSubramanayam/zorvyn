import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, Wallet, Eye, EyeOff } from 'lucide-react';

const QUICK_LOGINS = [
  { label: 'Admin',   email: 'admin@zorvyn.com',   password: 'admin123',   color: 'var(--primary-light)' },
  { label: 'Analyst', email: 'analyst@zorvyn.com', password: 'analyst123', color: '#fbbf24' },
  { label: 'Viewer',  email: 'viewer@zorvyn.com',  password: 'viewer123',  color: 'var(--text-muted)' },
];

export const Login = () => {
  const [email, setEmail]       = useState('admin@zorvyn.com');
  const [password, setPassword] = useState('admin123');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);   // ← calls backend DB via API service
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
      {/* Decorative blobs */}
      <div style={{ position: 'fixed', top: '-10%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 2 }}>
        <div className="glass animate-fade-up" style={{ padding: '40px 40px 36px' }}>
          {/* Brand */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 20px', background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(139,92,246,0.4)' }}>
              <Wallet size={26} color="white" />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Zorvyn Finance</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 8 }}>Sign in to your dashboard</p>
          </div>


          {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Email Address</label>
              <input className="input-field" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="name@company.com" />
            </div>
            <div className="input-group" style={{ marginBottom: 28 }}>
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input-field" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '0.95rem', opacity: loading ? 0.7 : 1 }}>
              <LogIn size={18} />
              {loading ? 'Authenticating…' : 'Sign In'}
            </button>
          </form>

          <hr className="divider" style={{ margin: '28px 0 20px' }} />

          {/* Quick login for demo */}
          <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 }}>Demo Quick Access</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {QUICK_LOGINS.map(({ label, email: e, password: p, color }) => (
              <button key={label} type="button" onClick={() => { setEmail(e); setPassword(p); }} style={{ flex: 1, padding: '9px 6px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', transition: 'all 0.15s ease' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
