import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';

/** Auth redirect base URL. Set VITE_SITE_URL in production (e.g. https://kolia-restaurant.vercel.app) */
const getAuthBaseUrl = () =>
  import.meta.env.VITE_SITE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://kolia-restaurant.vercel.app');

export type SignUpResult = { needsConfirmation?: boolean };

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Verify restaurant_owner role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profile?.role !== 'restaurant_owner') {
      await supabase.auth.signOut();
      throw new Error('Accès refusé : compte restaurateur requis');
    }
  };

  const signUp = async (email: string, password: string, fullName: string): Promise<SignUpResult> => {
    const redirectUrl = `${getAuthBaseUrl()}/auth/confirm`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: 'restaurant_owner' },
        emailRedirectTo: redirectUrl,
      },
    });
    if (error) throw error;
    const needsConfirmation = !data.session && data.user && !data.user.email_confirmed_at;
    return { needsConfirmation: !!needsConfirmation };
  };

  const resendConfirmation = async (email: string) => {
    const redirectUrl = `${getAuthBaseUrl()}/auth/confirm`;
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: redirectUrl },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, isLoading, signIn, signUp, signOut, resendConfirmation }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
