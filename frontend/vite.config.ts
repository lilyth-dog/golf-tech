import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import istanbul from 'vite-plugin-istanbul'

// https://vite.dev/config/
export default defineConfig(() => {
  const plugins: PluginOption[] = [react()]
  if (process.env.VITE_COVERAGE) {
    plugins.push(
      istanbul({
        include: [
          'src/App.tsx',
          'src/main.tsx',
          'src/pages/**/*.{ts,tsx}',
          'src/api/**/*.{ts,tsx}',
          'src/components/ProtectedRoute.tsx',
          'src/components/VideoUploader.tsx',
          'src/components/FeedbackMedia.tsx',
          'src/utils/**/*.{ts,tsx}',
        ],
        exclude: ['node_modules', 'e2e', 'playwright.config.ts'],
        extension: ['.ts', '.tsx'],
        requireEnv: false,
      })
    )
  }

  return { plugins }
})
