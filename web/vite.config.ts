import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: 'all',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://192.168.2.107:8080',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://192.168.2.107:8080',
        changeOrigin: true,
      },
    },
  },
})
