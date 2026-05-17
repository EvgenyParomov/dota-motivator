import { test, expect } from '@playwright/test';
import { authedSession, mockApi, mockMe } from './helpers';

test.describe('Онбординг', () => {
  test('новый пользователь после Steam-входа попадает на /onboarding', async ({ page }) => {
    await authedSession(page);
    await mockMe(page);
    await mockApi(page, {
      '/profile': { userId: 'u', debtThreshold: 0, onboardingCompleted: false },
      '/lots': [],
      '/balance': { balance: 0, debtThreshold: 0, canPlayMore: false },
      '/balance/events': [],
    });
    await page.goto('/dashboard');
    await page.waitForURL('**/onboarding');
    await expect(page.getByRole('heading', { name: 'Онбординг' })).toBeVisible();
  });
});
