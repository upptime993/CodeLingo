import { NavLink } from 'react-router-dom';
import { Map, User, Trophy } from 'lucide-react';

const tabs = [
  { to: '/belajar', icon: Map, label: 'Belajar' },
  { to: '/leaderboard', icon: Trophy, label: 'Peringkat' },
  { to: '/profil', icon: User, label: 'Profil' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-4 h-16 border-t"
      style={{
        background: 'rgba(14,19,24,0.95)',
        backdropFilter: 'blur(16px)',
        borderColor: 'var(--color-border)',
      }}>
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className="flex flex-col items-center gap-1 flex-1 py-2 transition-all"
          style={({ isActive }) => ({
            color: isActive ? 'var(--color-primary)' : 'var(--color-text-dim)',
          })}
        >
          {({ isActive }) => (
            <>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                style={{ background: isActive ? 'rgba(195,243,119,0.12)' : 'transparent' }}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-xs font-700">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
