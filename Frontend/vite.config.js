import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Every /api request in dev is forwarded to Django on port 8000
      '/api': {
        target:       'http://localhost:8000',
        changeOrigin: true,
        // no rewrite — Django already handles /api/ prefix
      },
      // Proxy media uploads from Django
      '/media': {
        target:       'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})