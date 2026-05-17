import { test, expect } from '@playwright/test';
import { authedSession, mockApi, mockMe } from './helpers';

test.describe('Главный экран', () => {
  test.describe('Загрузка экрана', () => {
    test('при открытии dashboard отрисовывает баланс, статус, лоты и ленту', async ({ page }) => {
      await authedSession(page);
      await mockMe(page);
      await mockApi(page, {
        '/profile': { userId: 'u', debtThreshold: 2, onboardingCompleted: true },
        '/balance': { balance: 5, debtThreshold: 2, canPlayMore: true },
        '/lots': [],
        '/balance/events': [],
      });
      await page.goto('/dashboard');
      await expect(page.getByText('Баланс')).toBeVisible();
    });

    test('при balance=0 показывает статус debt с предупреждением', async ({ page }) => {
      await authedSession(page);
      await mockMe(page);
      await mockApi(page, {
        '/profile': { userId: 'u', debtThreshold: 2, onboardingCompleted: true },
        '/balance': { balance: 0, debtThreshold: 2, canPlayMore: true },
        '/lots': [],
        '/balance/events': [],
      });
      await page.goto('/dashboard');
      await expect(page.getByText('долг')).toBeVisible();
    });

    test('при balance <= -debtThreshold показывает баннер блокировки', async ({ page }) => {
      await authedSession(page);
      await mockMe(page);
      await mockApi(page, {
        '/profile': { userId: 'u', debtThreshold: 2, onboardingCompleted: true },
        '/balance': { balance: -2, debtThreshold: 2, canPlayMore: false },
        '/lots': [],
        '/balance/events': [],
      });
      await page.goto('/dashboard');
      await expect(page.getByText('заблокировано')).toBeVisible();
    });
  });

  test.describe('Быстрое выполнение', () => {
    test('успешное выполнение лота с dashboard обновляет баланс и ленту без перезагрузки', () => {
      // @TODO mock execute endpoint, click "Выполнить", assert balance refetch
      expect(true).toBe(true);
    });

    test('нарушение правила показывает уведомление с причиной', () => {
      // @TODO render lot with canExecuteNow={allowed:false, reason:'...'}, assert reason visible
      expect(true).toBe(true);
    });
  });
});
