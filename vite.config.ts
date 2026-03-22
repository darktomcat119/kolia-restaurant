import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vercel sets VERCEL_URL at build time (e.g. my-app.vercel.app) — use so email links are not localhost
const vercelOrigin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';

export default defineConfig({
  base: process.env.VITE_BASE || '/',
  define: {
    'import.meta.env.VITE_VERCEL_ORIGIN': JSON.stringify(vercelOrigin),
  },
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
  },
});
