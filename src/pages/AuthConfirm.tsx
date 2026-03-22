import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import type { Restaurant } from '../lib/types';

export function AuthConfirm() {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'customer' | 'error'>('loading');

  useEffect(() => {
    const run = async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (typeof window !== 'undefined' && window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      if (s) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', s.user.id)
          .single();
        const isOwner = profile?.role === 'restaurant_owner';
        setStatus(isOwner ? 'success' : 'customer');
        if (isOwner) {
          try {
            const restaurants = await api.get<Restaurant[]>('/api/owner/restaurant');
            navigate(restaurants.length > 0 ? '/dashboard' : '/setup', { replace: true });
          } catch {
            navigate('/setup', { replace: true });
          }
        }
      } else if (!isLoading) {
        setStatus('error');
      }
    };
    run();
  }, [isLoading, navigate]);

  useEffect(() => {
    if (session && status === 'loading') {
      window.history.replaceState(null, '', window.location.pathname);
      supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
        .then(async ({ data }) => {
          const isOwner = data?.role === 'restaurant_owner';
          setStatus(isOwner ? 'success' : 'customer');
          if (isOwner) {
            try {
              const restaurants = await api.get<Restaurant[]>('/api/owner/restaurant');
              navigate(restaurants.length > 0 ? '/dashboard' : '/setup', { replace: true });
            } catch {
              navigate('/setup', { replace: true });
            }
          }
        });
    }
  }, [session, status, navigate]);

  if (status === 'customer') {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#FAFAF7] px-4 py-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="w-full max-w-md rounded-2xl border border-[#E5E3E0] bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-xl text-[#1A1A1A] mb-2">E-mail confirmé</h1>
          <p className="text-[#6B6560] font-body text-sm mb-6">
            Vous pouvez fermer cette page et vous connecter à l&apos;application Kolia.
          </p>
          <Link
            to="/login"
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-secondary px-6 py-3 font-body font-semibold text-white transition-colors hover:bg-secondary/90 sm:w-auto"
          >
            Aller à la connexion
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#FAFAF7] px-4 py-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#3D3A37] font-body">Redirection...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#FAFAF7] px-4 py-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="w-full max-w-md rounded-2xl border border-[#E5E3E0] bg-white p-6 text-center shadow-sm sm:p-8">
          <h1 className="font-display text-xl text-[#1A1A1A] mb-2">Lien invalide ou expiré</h1>
          <p className="text-[#6B6560] font-body text-sm mb-6">
            Le lien de confirmation a expiré ou a déjà été utilisé. Vous pouvez demander un nouvel e-mail depuis la page de connexion.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="min-h-[48px] w-full rounded-xl bg-secondary px-6 py-3 font-body font-semibold text-white transition-colors hover:bg-secondary/90 sm:w-auto"
          >
            Aller à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#FAFAF7] px-4 py-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#3D3A37] font-body">Confirmation en cours...</p>
      </div>
    </div>
  );
}
