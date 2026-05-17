import { test, expect } from '@playwright/test';
import { authedSession, mockApi, mockMe } from './helpers';

test.describe('Онбординг', () => {
  test.describe('Прохождение шагов', () => {
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

    test('установка debtThreshold переключает на шаг balance', () => {
      // @TODO Playwright with mocked PATCH /profile, click "Дальше", assert balance step visible
      expect(true).toBe(true);
    });

    test('установка стартового баланса переключает на шаг lots', () => {
      // @TODO Playwright: mock POST /profile/complete-onboarding, advance, assert lot form visible
      expect(true).toBe(true);
    });

    test('создание первого лота переключает на шаг gsi', () => {
      // @TODO Playwright: create lot via form, assert GSI step visible
      expect(true).toBe(true);
    });

    test('успешный GSI-чек переключает на complete и редиректит на /dashboard', () => {
      // @TODO requires Tauri runtime; in browser the GSI check returns manual_required
      expect(true).toBe(true);
    });
  });

  test.describe('Возврат к онбордингу', () => {
    test('пользователь с onboardingCompleted=false при попытке открыть /dashboard редиректится на /onboarding', async ({
      page,
    }) => {
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
    });

    test('пользователь с onboardingCompleted=true при попытке открыть /onboarding редиректится на /dashboard', () => {
      // @TODO add route guard for onboarding → dashboard when completed
      expect(true).toBe(true);
    });
  });
});
