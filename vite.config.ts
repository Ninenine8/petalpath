
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['petalpath.onrender.com', 'localhost'],
    host: true,
  },
  preview: {
    allowedHosts: ['petalpath.onrender.com'],
    host: true,
  },
});
