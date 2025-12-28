import { test, expect } from '@playwright/test';

test('overview', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  /*
    await t.wait(1000);

  const logoExists = Selector(".logo").exists;

  await t.expect(logoExists).ok();
*/
});
