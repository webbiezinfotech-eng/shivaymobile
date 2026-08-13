import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BottomNav from './BottomNav';
import AppFooter from './AppFooter';

function navClass({ isActive }) {
  return isActive
    ? 'rounded-lg bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-800'
    : 'rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100';
}

export default function AppLayout({ title, children, navItems = [], bottomNavItems = [] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const roleLabel = user?.role === 'owner' ? 'Owner' : 'Sameer';

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <Link to={user?.role === 'owner' ? '/owner' : '/sameer'} className="text-lg font-bold text-brand-800">
              Shivay Mobile
            </Link>
            <p className="text-sm text-slate-500">{roleLabel}{title ? ` · ${title}` : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === 'owner' && (
              <Link to="/owner/change-password" className="btn-secondary min-h-10 px-4 py-2 text-sm">
                Password
              </Link>
            )}
            <button type="button" onClick={handleLogout} className="btn-secondary min-h-10 px-4 py-2 text-sm">
              Logout
            </button>
          </div>
        </div>
        {navItems.length > 0 && (
          <nav className="mx-auto hidden max-w-6xl gap-2 overflow-x-auto px-4 pb-3 md:flex">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass} end={item.end}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

      <AppFooter className="mb-20 md:mb-0" />

      <BottomNav items={bottomNavItems} />
    </div>
  );
}

export const sameerBottomNav = [
  { to: '/sameer', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/sameer/entries', label: 'Entries', icon: '📋' },
  { to: '/sameer/add-entry', label: 'Add Entry', icon: '➕' },
];

export const ownerBottomNav = [
  { to: '/owner', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/owner/add-entry', label: 'Add', icon: '➕' },
  { to: '/owner/entries', label: 'Entries', icon: '📋' },
  { to: '/owner/pending', label: 'Pending', icon: '⏳' },
  { to: '/owner/reports', label: 'Reports', icon: '📊' },
];