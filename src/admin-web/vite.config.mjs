import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/admin',
  server: {
    port: 3001,
    host: '0.0.0.0',
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '8af261c807b8.ngrok-free.app'
    ],
  }
});
