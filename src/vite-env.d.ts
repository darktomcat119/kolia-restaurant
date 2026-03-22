/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Injected in vite.config from VERCEL_URL at build time */
  readonly VITE_VERCEL_ORIGIN?: string;
}
