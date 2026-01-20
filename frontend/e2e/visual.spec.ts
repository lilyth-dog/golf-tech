import { test, expect } from '@playwright/test';
import { attachApiMocks, disableAnimations, stubMediaApis } from './mocks';

test.beforeEach(async ({ page }) => {
  await stubMediaApis(page);
  attachApiMocks(page);
  await disableAnimations(page);
});

test('login page visual', async ({ page }) => {
  await page.goto('/login');
  await expect(page).toHaveScreenshot('login.png', { fullPage: true });
});

test('home page visual (authenticated)', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'e2e-token');
  });
  await page.goto('/');
  await expect(page.getByText('Welcome to Golf Tech')).toBeVisible();
  await expect(page).toHaveScreenshot('home.png', { fullPage: true });
});

test('analyze report visual', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'e2e-token');
  });
  await page.goto('/analyze');
  await expect(page.getByText(/GOLF CENTRE/i)).toBeVisible();
  await page.getByRole('button', { name: /INITIALIZE SCANNER/i }).click();
  await expect(page.getByRole('button', { name: /GENERATE AI REPORT/i })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /GENERATE AI REPORT/i }).click();
  await expect(page.getByText(/TODAY'S ONE THING/i)).toBeVisible();
  await expect(page).toHaveScreenshot('analyze-report.png', { fullPage: true });
});

test('profile page visual (authenticated)', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'e2e-token');
  });
  await page.goto('/profile');
  await expect(page.getByText('My Profile')).toBeVisible();
  await expect(page).toHaveScreenshot('profile.png', { fullPage: true });
});

test('swing analysis page visual (authenticated)', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'e2e-token');
  });
  await page.goto('/swing-analysis');
  await expect(page.getByText('🏌️ 스윙 영상 분석')).toBeVisible();
  await expect(page).toHaveScreenshot('swing-analysis.png', { fullPage: true });
});

