import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, FolderOpen, FileQuestion, Upload, Users, LogOut, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/kelas', label: 'Kelas', icon: BookOpen },
  { to: '/admin/bab', label: 'Bab & Level', icon: FolderOpen },
  { to: '/admin/soal', label: 'Soal', icon: FileQuestion },
  { to: '/admin/impor', label: 'Impor JSON', icon: Upload },
  { to: '/admin/pengguna', label: 'Pengguna', icon: Users },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 flex flex-col border-r hidden lg:flex"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>

        {/* Brand */}
        <div className="flex items-center gap-2 px-5 h-16 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <span className="text-xl">💻</span>
          <div>
            <span className="font-display font-800 text-base" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-display)' }}>
              CodeLingo
            </span>
            <p className="text-xs" style={{ color: 'var(--color-purple)' }}>Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-600 transition-all ${isActive ? 'active-nav' : 'inactive-nav'}`
              }
              style={({ isActive }) => ({
                background: isActive ? 'rgba(168,85,247,0.15)' : 'transparent',
                color: isActive ? 'var(--color-purple)' : 'var(--color-text-muted)',
                border: isActive ? '1.5px solid rgba(168,85,247,0.3)' : '1.5px solid transparent',
              })}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info + Logout */}
        <div className="p-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-1"
            style={{ background: 'var(--color-surface-2)' }}>
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
              className="w-8 h-8 rounded-full" alt={user?.username}
              style={{ border: '2px solid var(--color-purple)' }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-600 truncate">{user?.username}</p>
              <p className="text-xs truncate" style={{ color: 'var(--color-purple)' }}>Admin</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm w-full transition-colors"
            style={{ color: 'var(--color-coral)' }}
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 border-b"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <span className="font-display font-800" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-display)' }}>
          💻 Admin
        </span>
        <div className="flex gap-1">
          {navItems.slice(0, 5).map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/admin'}
              style={({ isActive }) => ({
                padding: '6px',
                borderRadius: '8px',
                color: isActive ? 'var(--color-purple)' : 'var(--color-text-dim)',
                background: isActive ? 'rgba(168,85,247,0.15)' : 'transparent',
              })}>
              <Icon size={18} />
            </NavLink>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto" style={{ background: 'var(--color-bg)' }}>
        <div className="pt-14 lg:pt-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
