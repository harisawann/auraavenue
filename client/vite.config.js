import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // Forward /api requests to the Express backend during development
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/sitemap.xml': { target: 'http://localhost:5000', changeOrigin: true },
      '/robots.txt': { target: 'http://localhost:5000', changeOrigin: true }
    }
  }
})
