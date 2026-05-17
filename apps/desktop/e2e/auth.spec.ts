import { test, expect } from '@playwright/test';

test.describe('Аутентификация', () => {
  test('логин-экран отображается без токена', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /Войти через Steam/i })).toBeVisible();
  });

  test('callback-роут принимает токен из query и редиректит на dashboard', async ({ page }) => {
    await page.route('**/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'u',
          steamId: '1',
          personaName: 'tester',
          avatarUrl: '',
        }),
      }),
    );
    await page.route('**/profile', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          userId: 'u',
          debtThreshold: 0,
          onboardingCompleted: true,
        }),
      }),
    );
    await page.route('**/balance', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ balance: 5, debtThreshold: 0, canPlayMore: true }),
      }),
    );
    await page.route('**/lots', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    await page.route('**/balance/events', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    await page.goto('/auth/callback?token=my-test-token');
    await page.waitForURL('**/dashboard');
    const stored = await page.evaluate(() => localStorage.getItem('dm.auth-token'));
    expect(stored).toBe('my-test-token');
  });
});
