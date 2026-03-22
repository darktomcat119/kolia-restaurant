import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, Settings, LogOut, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../lib/auth';
import type { LucideIcon } from 'lucide-react';

const NAV_ITEMS: { path: string; label: string; icon: LucideIcon }[] = [
  { path: '/dashboard', label: 'Commandes', icon: LayoutDashboard },
  { path: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { path: '/settings', label: 'Paramètres', icon: Settings },
];

type SidebarProps = {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
};

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    onCloseMobile?.();
    await signOut();
    navigate('/login');
  };

  const email = session?.user?.email ?? '';
  const initials = email ? email.slice(0, 2).toUpperCase() : 'RS';

  const linkClick = () => onCloseMobile?.();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-[min(280px,88vw)] max-w-[280px] flex-col border-r border-white/[0.04] bg-gradient-to-b from-[#0A1410] via-[#0F1A14] to-[#0D1812] text-white shadow-2xl transition-transform duration-300 ease-out lg:static lg:z-auto lg:max-w-none lg:w-[260px] lg:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="relative flex max-h-screen min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        <button
          type="button"
          onClick={() => onCloseMobile?.()}
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 lg:hidden hover:bg-white/10"
          aria-label="Fermer le menu"
        >
          <X size={18} />
        </button>

        <div className="px-6 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))] lg:px-7 lg:pb-6 lg:pt-7">
          <div className="flex flex-col gap-1.5 pr-10 lg:pr-0">
            <img src="/images/logo.png" alt="Kolia" className="h-10 w-auto object-contain object-left lg:h-12" />
            <p className="font-body text-[10px] uppercase tracking-[0.2em] text-white/25">Espace Restaurant</p>
          </div>
        </div>

        <div className="mx-6 mb-5">
          <div className="h-px bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-transparent" />
        </div>

        <div className="px-7 pb-3">
          <p className="font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-white/20">Navigation</p>
        </div>

        <nav className="flex-1 space-y-1 px-4 pb-4">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={linkClick}
              className={({ isActive }) =>
                `group relative flex min-h-[48px] items-center gap-3.5 rounded-xl px-4 py-3 font-body text-[13px] font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-secondary/90 to-secondary/70 text-white shadow-lg shadow-secondary/25'
                    : 'text-white/35 hover:bg-white/[0.05] hover:text-white/80 hover:shadow-sm'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-white shadow-sm shadow-white/30" />
                  )}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                      isActive ? 'bg-white/15' : 'bg-transparent group-hover:bg-white/[0.06]'
                    }`}
                  >
                    <Icon size={17} className={`transition-all duration-200 ${isActive ? 'text-white' : 'text-white/35 group-hover:text-white/70'}`} />
                  </div>
                  <span className="min-w-0 flex-1 tracking-wide">{label}</span>
                  {isActive && <ChevronRight size={14} className="shrink-0 text-white/40" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mx-6 my-4">
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
        </div>

        <div className="mt-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="mb-4 flex items-center gap-3.5 px-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-secondary via-[#2D8F5A] to-secondary/80 shadow-lg shadow-secondary/20 ring-2 ring-white/[0.08]">
              <span className="font-body text-[11px] font-semibold text-white">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="truncate font-body text-xs font-medium leading-tight text-white/75">{email}</p>
              <p className="mt-0.5 font-body text-[10px] tracking-wide text-white/25">Propriétaire</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="group flex min-h-[44px] w-full items-center gap-3 rounded-xl px-4 py-2.5 font-body text-xs text-white/30 transition-all duration-200 hover:bg-red-500/[0.08] hover:text-red-400"
          >
            <LogOut size={14} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
            <span className="tracking-wide">Déconnexion</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
