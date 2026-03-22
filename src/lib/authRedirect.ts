/**
 * URLs passed to Supabase (emailRedirectTo / redirectTo) must exactly match
 * entries in Supabase Dashboard → Authentication → Redirect URLs.
 * If they don't match, Supabase falls back to "Site URL" (often localhost:3000).
 */

const DEFAULT_ORIGIN = 'https://kolia-restaurant.vercel.app';

function getOrigin(): string {
  const explicit = import.meta.env.VITE_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');

  const vercel = import.meta.env.VITE_VERCEL_ORIGIN?.trim();
  if (vercel) return vercel.replace(/\/$/, '');

  if (typeof window !== 'undefined') {
    return window.location.origin.replace(/\/$/, '');
  }

  return DEFAULT_ORIGIN;
}

/** Path under Vite base, e.g. /restaurant/auth/confirm when base is /restaurant/ */
function pathWithBase(suffix: string): string {
  const rawBase = import.meta.env.BASE_URL || '/';
  const basePath =
    rawBase === '/' ? '' : rawBase.replace(/^\/+|\/+$/g, '');
  const seg = suffix.replace(/^\//, '');
  return basePath ? `/${basePath}/${seg}` : `/${seg}`;
}

export function getAuthConfirmRedirectUrl(): string {
  return `${getOrigin()}${pathWithBase('auth/confirm')}`;
}

export function getPasswordResetRedirectUrl(): string {
  return `${getOrigin()}${pathWithBase('reset-password')}`;
}
