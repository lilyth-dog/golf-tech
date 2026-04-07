import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Set VITE_BASE for GitHub Pages project sites, e.g. VITE_BASE=/golf-tech/
const base = process.env.VITE_BASE ?? '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
  server: {
    proxy: {
      // Same-origin /api in dev → Django on :8000 (avoids browser CORS to localhost:8000)
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
