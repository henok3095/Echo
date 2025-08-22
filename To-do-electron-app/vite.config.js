import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    define: {
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'process.env.VITE_LASTFM_API_KEY': JSON.stringify(env.VITE_LASTFM_API_KEY),
      'process.env.NODE_ENV': JSON.stringify(mode)
    },
    plugins: [react()],
    base: './', // This is important for Electron
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            ui: ['@supabase/supabase-js'],
          },
        },
      },
    },
    server: {
      port: 5173, // Match this with the port in main.js
      strictPort: true, // Don't try to find another port if 5173 is in use
    },
  };
});