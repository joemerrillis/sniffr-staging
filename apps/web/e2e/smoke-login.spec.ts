// Minimal smoke: /login → sign in → dashboard header
import { test, expect } from '@playwright/test';

const BASE  = process.env.E2E_BASE_URL!;
const EMAIL = process.env.E2E_USER_EMAIL!;
const PASS  = process.env.E2E_USER_PASSWORD!;
const LOGIN_PATH = process.env.E2E_LOGIN_PATH || '/login';

test('login → dashboard header', async ({ page }) => {
  await page.goto(`${BASE}${LOGIN_PATH}`, { waitUntil: 'domcontentloaded' });

  // Be tolerant about selectors — prefer data-testid, then common fallbacks.
  await page.locator('[data-testid="login-email"], input[name="email"], input[type="email"]').first().fill(EMAIL);
  await page.locator('[data-testid="login-password"], input[name="password"], input[type="password"]').first().fill(PASS);

  // Click "Log in" / "Sign in"
  const submit =
    page.getByTestId('login-submit')
      .or(page.getByRole('button', { name: /sign in|log in/i }))
      .or(page.locator('button[type=submit]'))
      .first();
  await submit.click();

  // Wait for redirect (accept /dashboard, /app, /home etc.)
  await page.waitForURL(/\/(dashboard|app|home)/, { timeout: 30_000 });

  // Assert a stable header (prefer a testid if you add one)
  await expect(
    page.locator(
      '[data-testid="dashboard-header"], h1:has-text("Dashboard"), [role="heading"]:has-text("Dashboard")'
    ).first()
  ).toBeVisible({ timeout: 10_000 });
});
