import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ReceiptText, Users, LogOut, Wallet, ShieldCheck } from 'lucide-react';

const navItems = [
  { name: 'Dashboard',    icon: LayoutDashboard, path: '/',        roles: ['VIEWER','ANALYST','ADMIN'] },
  { name: 'Records',      icon: ReceiptText,      path: '/records', roles: ['ANALYST','ADMIN'] },
  { name: 'User Control', icon: Users,            path: '/users',   roles: ['ADMIN'] },
];

const roleColors: Record<string, string> = {
  ADMIN:   'var(--primary-light)',
  ANALYST: '#fbbf24',
  VIEWER:  'var(--text-muted)',
};

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const visible = navItems.filter(i => i.roles.includes(user?.role || ''));

  return (
    <aside style={{
      width: 240,
      minHeight: '100vh',
      background: 'rgba(11,15,26,0.95)',
      borderRight: '1px solid var(--glass-border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      zIndex: 50,
      backdropFilter: 'blur(20px)',
    }}>
      {/* Logo */}
      <div style={{ padding: '28px 20px 24px', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(139,92,246,0.35)',
            flexShrink: 0,
          }}>
            <Wallet size={18} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.3px' }}>Zorvyn</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: 1 }}>Finance Suite</div>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 600, letterSpacing: 1, padding: '8px 10px', textTransform: 'uppercase' }}>Menu</div>
        {visible.map(({ name, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            end
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '11px 12px',
              borderRadius: 12,
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 500,
              transition: 'all 0.15s ease',
              color: isActive ? 'white' : 'var(--text-muted)',
              background: isActive
                ? 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(124,58,237,0.15))'
                : 'transparent',
              borderLeft: isActive ? '2px solid var(--primary)' : '2px solid transparent',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                {name}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div style={{ padding: '16px 12px 24px', borderTop: '1px solid var(--glass-border)' }}>
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--glass-border)',
          borderRadius: 14,
          padding: '14px',
          marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', fontWeight: 700, flexShrink: 0,
            }}>
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email || 'User'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <ShieldCheck size={10} color={roleColors[user?.role || 'VIEWER'] || roleColors.VIEWER} />
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: roleColors[user?.role || 'VIEWER'] || roleColors.VIEWER }}>
                  {user?.role || 'VIEWER'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}>
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
