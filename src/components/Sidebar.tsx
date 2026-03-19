import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, Settings, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../lib/auth';
import type { LucideIcon } from 'lucide-react';

const NAV_ITEMS: { path: string; label: string; icon: LucideIcon }[] = [
  { path: '/dashboard', label: 'Commandes', icon: LayoutDashboard },
  { path: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { path: '/settings', label: 'Paramètres', icon: Settings },
];

export function Sidebar() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const email = session?.user?.email ?? '';
  const initials = email ? email.slice(0, 2).toUpperCase() : 'RS';

  return (
    <aside className="w-[260px] bg-gradient-to-b from-[#0A1410] via-[#0F1A14] to-[#0D1812] text-white flex flex-col min-h-screen border-r border-white/[0.04] shadow-2xl">
      {/* Logo */}
      <div className="px-7 pt-7 pb-6">
        <div className="flex flex-col gap-1.5">
          <img src="/images/logo.png" alt="Kolia" className="h-12 w-auto object-contain object-left" />
          <p className="font-body text-[10px] text-white/25 uppercase tracking-[0.2em]">Espace Restaurant</p>
        </div>
      </div>

      {/* Decorative line */}
      <div className="mx-6 mb-5">
        <div className="h-px bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-transparent" />
      </div>

      {/* Nav label */}
      <div className="px-7 pb-3">
        <p className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.2em] font-body">Navigation</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `group relative flex items-center gap-3.5 px-4 py-3 rounded-xl text-[13px] font-body font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-secondary/90 to-secondary/70 text-white shadow-lg shadow-secondary/25'
                  : 'text-white/35 hover:text-white/80 hover:bg-white/[0.05] hover:shadow-sm'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Left border indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-white rounded-r-full shadow-sm shadow-white/30" />
                )}
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-white/15'
                    : 'bg-transparent group-hover:bg-white/[0.06]'
                }`}>
                  <Icon size={17} className={`transition-all duration-200 ${isActive ? 'text-white' : 'text-white/35 group-hover:text-white/70'}`} />
                </div>
                <span className="flex-1 tracking-wide">{label}</span>
                {isActive && <ChevronRight size={14} className="text-white/40" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Decorative divider */}
      <div className="mx-6 my-4">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
      </div>

      {/* User */}
      <div className="px-5 pb-6">
        {/* Avatar row */}
        <div className="flex items-center gap-3.5 mb-4 px-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary via-[#2D8F5A] to-secondary/80 flex items-center justify-center shrink-0 ring-2 ring-white/[0.08] shadow-lg shadow-secondary/20">
            <span className="text-white font-body font-semibold text-[11px]">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-white/75 text-xs font-body font-medium truncate leading-tight">{email}</p>
            <p className="text-white/25 text-[10px] font-body mt-0.5 tracking-wide">Propriétaire</p>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/[0.08] transition-all duration-200 text-xs font-body group"
        >
          <LogOut size={14} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
          <span className="tracking-wide">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
