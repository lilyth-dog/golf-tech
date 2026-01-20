import type { Page } from '@playwright/test';

export async function disableAnimations(page: Page) {
  await page.addStyleTag({
    content: `
      *,
      *::before,
      *::after {
        transition: none !important;
        animation: none !important;
        caret-color: transparent !important;
      }
    `,
  });
}

export function attachApiMocks(page: Page) {
  // Auth endpoints
  page.route('**/api/auth/login/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ token: 'e2e-token', user_id: 1, username: 'e2e' }),
    });
  });
  page.route('**/api/auth/register/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ token: 'e2e-token', user_id: 1, username: 'e2e' }),
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

  // Video upload endpoint
  page.route('**/api/analysis/upload/', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 555,
        created_at: new Date().toISOString(),
        video_url: '/media/uploads/e2e.mp4',
        shoulder_angle: 90,
        hip_rotation: 45,
        knee_flexion: 25,
        spine_angle: 40,
        ai_feedback: '업로드 기반 분석(목킹) 완료',
        x_factor: 45,
        angular_momentum: 12.34,
        physics_score: 88,
      }),
    });
  });
}

export async function stubMediaApis(page: Page) {
  await page.addInitScript(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const navAny: any = navigator;
    if (!navAny.mediaDevices) navAny.mediaDevices = {};
    navAny.mediaDevices.getUserMedia = async () => {
      const stream = new MediaStream();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (stream as any).getTracks = () => [{ stop() {} }];
      return stream;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (HTMLMediaElement.prototype as any).play = async () => {};
  });
}

