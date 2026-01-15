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

