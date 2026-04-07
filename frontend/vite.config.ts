import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Set VITE_BASE for GitHub Pages project sites, e.g. VITE_BASE=/golf-tech/
const base = process.env.VITE_BASE ?? '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
})
