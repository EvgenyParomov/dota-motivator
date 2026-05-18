import { test, expect } from '@playwright/test';
import { authedSession, mockApi, mockMe } from './helpers';

test.describe('Главный экран', () => {
  test('загрузка экрана отрисовывает баланс, статус, лоты и ленту', async ({ page }) => {
    await authedSession(page);
    await mockMe(page);
    await mockApi(page, {
      '/profile': { userId: 'u', debtThreshold: 2, onboardingCompleted: true },
      '/balance': { balance: 5, debtThreshold: 2, canPlayMore: true },
      '/lots': [
        {
          id: 'l1',
          name: 'Пробежка',
          sphere: 'health',
          reward: 1,
          rules: [],
          iconMediaKey: null,
          iconUrl: null,
          isActive: true,
          canExecuteNow: { allowed: true },
        },
      ],
      '/balance/events': [
        {
          id: 'e1',
          type: 'credit',
          delta: 1,
          causeKind: 'lot-execution',
          description: 'выполнен лот',
          createdAt: new Date().toISOString(),
        },
      ],
    });
    await page.goto('/dashboard');
    await expect(page.getByText('Баланс')).toBeVisible();
    await expect(page.getByText('Пробежка')).toBeVisible();
    await expect(page.getByText('выполнен лот')).toBeVisible();
  });
});
