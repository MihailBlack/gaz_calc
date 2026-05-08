import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages serves project site from /<repo-name>/, not from /
  base: command === 'build' ? '/gaz_calc/' : '/',
}));
