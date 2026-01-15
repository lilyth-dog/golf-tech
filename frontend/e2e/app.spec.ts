import { test, expect } from '@playwright/test';

const ROUTES = ['/', '/profile', '/analyze', '/swing-analysis', '/login', '/register'] as const;

function attachApiMocks(page: import('@playwright/test').Page) {
  // Auth endpoints
  page.route('**/api/auth/login/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ token: 'e2e-token' }),
    });
  });
  page.route('**/api/auth/register/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ token: 'e2e-token' }),
    });
  });

  // Profile endpoints
  page.route('**/api/profile/', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          user: 1,
          nickname: 'E2E',
          height: 180,
          weight: 75,
          handicap: 18,
          years_experience: 3,
        }),
      });
      return;
    }
    if (route.request().method() === 'PUT' || route.request().method() === 'PATCH' || route.request().method() === 'POST') {
      const body = route.request().postDataJSON?.() ?? {};
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
      return;
    }
    await route.fulfill({ status: 405 });
  });

  // Analysis create endpoint
  page.route('**/api/analysis/analyze/', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 123,
        created_at: new Date().toISOString(),
        shoulder_angle: 90,
        hip_rotation: 45,
        knee_flexion: 25,
        spine_angle: 40,
        ai_feedback: '테스트 피드백: 안정적입니다.',
        x_factor: 45,
        angular_momentum: 12.34,
        physics_score: 88,
        swing_tempo_ratio: 3.0,
        downswing_time_s: 0.32,
        omega_peak: 4.56,
        evaluation: {
          overall_score: 90,
          components: {
            x_factor_score: 92,
            tempo_score: 95,
            posture_score: 85,
            rotation_speed_score: 88,
            release_score: 80,
            sequence_score: 75,
          },
          inputs: {
            x_factor: 45,
            swing_tempo_ratio: 3.0,
            knee_flexion: 25,
            spine_angle: 40,
            release_rate_rad_s: 2.2,
            lead_ms: 40,
          },
          flags: [],
          recommendations: ['오늘은 한 가지에 집중하세요.'],
          targets: {
            x_factor_deg: { min: 30, max: 60, unit: 'deg' },
            tempo_ratio: { min: 2.5, max: 3.5, unit: 'ratio' },
            knee_flexion_deg: { min: 20, max: 30, unit: 'deg' },
            spine_angle_deg: { min: 35, max: 45, unit: 'deg' },
            release_rate_rad_s: { min: 2, max: 6, unit: 'rad/s' },
            lead_ms: { min: 0, max: 150, unit: 'ms' },
          },
          primary_recommendation: {
            title: '오늘의 1개: 3:1 템포 맞추기',
            reason: 'E2E 시나리오용 추천입니다.',
            drill: '카운트로 템포를 맞추세요.',
            metric: 'tempo_ratio',
            target: { min: 2.5, max: 3.5, unit: 'ratio' },
          },
        },
      }),
    });
  });
}

test.beforeEach(async ({ page }) => {
  // Provide stable stubs for media APIs used by /analyze
  await page.addInitScript(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const navAny: any = navigator;
    if (!navAny.mediaDevices) navAny.mediaDevices = {};
    navAny.mediaDevices.getUserMedia = async () => {
      // Use a real MediaStream so assigning to `video.srcObject` doesn't throw.
      const stream = new MediaStream();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (stream as any).getTracks = () => [{ stop() {} }];
      return stream;
    };
    // Some browsers block play() in headless
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (HTMLMediaElement.prototype as any).play = async () => {};
  });

  attachApiMocks(page);
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

  // Register page reachable
  await page.goto('/register');
  await expect(page).toHaveURL(/\/register$/);
  visited.add('/register');
  await expect(page.getByText('Create Account')).toBeVisible();

  const coverage = visited.size / ROUTES.length;
  expect(coverage).toBeGreaterThanOrEqual(0.98);
});

