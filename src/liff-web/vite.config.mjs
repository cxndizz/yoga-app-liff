import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const baseAllowedHosts = ['localhost', '127.0.0.1'];
const envAllowedHosts = (process.env.VITE_ALLOWED_HOSTS || '')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean);

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    allowedHosts: [...baseAllowedHosts, ...envAllowedHosts]
  }
});
