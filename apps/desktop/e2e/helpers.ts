import type { Page } from '@playwright/test';

export const authedSession = async (page: Page, token = 'e2e-token'): Promise<void> => {
  await page.addInitScript((t) => {
    localStorage.setItem('dm.auth-token', t);
  }, token);
};

export const mockMe = async (page: Page): Promise<void> => {
  await page.route('**/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'user-1',
        steamId: '76561198000000999',
        personaName: 'tester',
        avatarUrl: '',
      }),
    }),
  );
};

export const mockApi = async (
  page: Page,
  endpoints: Record<string, unknown>,
): Promise<void> => {
  for (const [path, body] of Object.entries(endpoints)) {
    await page.route(`**${path}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      }),
    );
  }
};
