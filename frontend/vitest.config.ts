import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      include: [
        'src/App.tsx',
        'src/pages/LoginPage.tsx',
        'src/pages/RegisterPage.tsx',
        'src/pages/ProfilePage.tsx',
        'src/pages/SwingAnalysis.tsx',
        'src/components/ProtectedRoute.tsx',
        'src/components/VideoUploader.tsx',
        'src/components/FeedbackMedia.tsx',
        'src/api/client.ts',
        'src/api/auth.ts',
        'src/api/profile.ts',
        'src/api/analysis.ts',
      ],
      exclude: ['src/main.tsx', 'src/pages/VideoAnalyzer3D.tsx'],
      thresholds: {
        lines: 98,
        statements: 98,
        branches: 90,
        functions: 90,
      },
    },
  },
});

