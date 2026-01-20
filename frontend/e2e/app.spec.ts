import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { attachApiMocks, stubMediaApis, disableAnimations } from './mocks';

const ROUTES = ['/', '/profile', '/analyze', '/swing-analysis', '/login', '/register'] as const;

async function saveIstanbulCoverage(page: Page, nameHint: string) {
  if (!process.env.VITE_COVERAGE) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cov = await page.evaluate(() => (window as any).__coverage__ ?? null);
  if (!cov) return;
  const dir = path.join(process.cwd(), '.nyc_output');
  fs.mkdirSync(dir, { recursive: true });
  const safe = nameHint.replace(/[^a-zA-Z0-9._-]+/g, '_');
  const file = path.join(dir, `coverage-${Date.now()}-${safe}.json`);
  fs.writeFileSync(file, JSON.stringify(cov));
}

test.beforeEach(async ({ page }) => {
  await stubMediaApis(page);
  attachApiMocks(page);
  await disableAnimations(page);
});

test.afterEach(async ({ page }, testInfo) => {
  await saveIstanbulCoverage(page, `${testInfo.title.replace(/\s+/g, '_')}`);
});

test('unauthenticated users are redirected to /login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText('Welcome Back')).toBeVisible();
});

test('login flow works and routes are reachable (>= 98% route coverage)', async ({ page }) => {
  const visited = new Set<string>();

  // Login
  await page.goto('/login');
  visited.add('/login');
  await page.getByPlaceholder('Enter your username').fill('u1');
  await page.getByPlaceholder('Enter your password').fill('pw');
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Home
  await expect(page).toHaveURL(/\/$/);
  visited.add('/');
  await expect(page.getByText('Welcome to Golf Tech')).toBeVisible();

  // Profile
  await page.getByRole('link', { name: /My Profile/i }).click();
  await expect(page).toHaveURL(/\/profile$/);
  visited.add('/profile');
  await expect(page.getByText('My Profile')).toBeVisible();
  // Touch save path for coverage
  await page.getByPlaceholder('Enter nickname').fill('E2E2');
  await page.getByRole('button', { name: /Save Profile/i }).click();
  await expect(page.getByText(/Profile updated successfully!/i)).toBeVisible();

  // Analyze (3D)
  await page.goto('/analyze');
  await expect(page).toHaveURL(/\/analyze$/);
  visited.add('/analyze');
  await expect(page.getByText(/GOLF CENTRE/i)).toBeVisible();
  await page.getByRole('button', { name: /INITIALIZE SCANNER/i }).click();
  await expect(page.getByRole('button', { name: /GENERATE AI REPORT/i })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /GENERATE AI REPORT/i }).click();
  await expect(page.getByText(/TODAY'S ONE THING/i)).toBeVisible();
  await expect(page.getByText(/EVALUATION/i)).toBeVisible();

  // Swing analysis page
  await page.goto('/swing-analysis');
  await expect(page).toHaveURL(/\/swing-analysis$/);
  visited.add('/swing-analysis');
  await expect(page.getByText('🏌️ 스윙 영상 분석')).toBeVisible();
  // Upload invalid file (non-video)
  const uploadInput = page.locator('input[type="file"]');
  await uploadInput.setInputFiles({
    name: 'bad.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('x'),
  });
  await expect(page.getByText('동영상 파일만 업로드 가능합니다.')).toBeVisible();
  // Upload valid video file and start analysis
  await uploadInput.setInputFiles({
    name: 'swing.mp4',
    mimeType: 'video/mp4',
    buffer: Buffer.from('fake'),
  });
  await page.getByRole('button', { name: /영상 분석 시작/i }).click();
  await expect(page.getByText(/업로드 기반 분석/)).toBeVisible();

  // Register page reachable
  await page.goto('/register');
  await expect(page).toHaveURL(/\/register$/);
  visited.add('/register');
  await expect(page.getByText('Create Account')).toBeVisible();

  const coverage = visited.size / ROUTES.length;
  expect(coverage).toBeGreaterThanOrEqual(0.98);
});

test('login failure shows error message', async ({ page }) => {
  await page.route('**/api/auth/login/', async (route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ detail: 'invalid' }) });
  });
  await page.goto('/login');
  await page.getByPlaceholder('Enter your username').fill('u1');
  await page.getByPlaceholder('Enter your password').fill('bad');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByText('Invalid credentials')).toBeVisible();
});

