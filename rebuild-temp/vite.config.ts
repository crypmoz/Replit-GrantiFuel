import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import cartographerPlugin from '@replit/vite-plugin-cartographer';
import runtimeErrorModal from '@replit/vite-plugin-runtime-error-modal';
import shadcnPlugin from '@replit/vite-plugin-shadcn-theme-json';

export default defineConfig({
  plugins: [
    react(),
    cartographerPlugin(),
    runtimeErrorModal(),
    shadcnPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@server': path.resolve(__dirname, './server'),
      '@shared': path.resolve(__dirname, './shared')
    }
  },
  server: {
    host: '0.0.0.0',
    hmr: {
      clientPort: 443,
    }
  }
});