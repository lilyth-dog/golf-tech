import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { attachApiMocks, disableAnimations, stubMediaApis } from './mocks';

async function expectNoSeriousA11yViolations(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page })
    // keep it practical for MLP, still meaningful
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await stubMediaApis(page);
  attachApiMocks(page);
  await disableAnimations(page);
});

test('login page a11y (no serious/critical)', async ({ page }) => {
  await page.goto('/login');
  await expectNoSeriousA11yViolations(page);
});

test('home page a11y (authenticated)', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('token', 'e2e-token'));
  await page.goto('/');
  await expect(page.getByText('Welcome to Golf Tech')).toBeVisible();
  await expectNoSeriousA11yViolations(page);
});

test('profile page a11y (authenticated)', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('token', 'e2e-token'));
  await page.goto('/profile');
  await expect(page.getByText('My Profile')).toBeVisible();
  await expectNoSeriousA11yViolations(page);
});

test('swing analysis page a11y (authenticated)', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('token', 'e2e-token'));
  await page.goto('/swing-analysis');
  await expect(page.getByText('🏌️ 스윙 영상 분석')).toBeVisible();
  await expectNoSeriousA11yViolations(page);
});

test('analyze report a11y (authenticated)', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('token', 'e2e-token'));
  await page.goto('/analyze');
  await expect(page.getByText(/GOLF CENTRE/i)).toBeVisible();
  await page.getByRole('button', { name: /INITIALIZE SCANNER/i }).click();
  await expect(page.getByRole('button', { name: /GENERATE AI REPORT/i })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /GENERATE AI REPORT/i }).click();
  await expect(page.getByText(/TODAY'S ONE THING/i)).toBeVisible();
  await expectNoSeriousA11yViolations(page);
});

