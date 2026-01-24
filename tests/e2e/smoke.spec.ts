import { test, expect } from '@playwright/test';

test('has title and loads root element', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/THE GEAR/);

    // Expect the root div to be visible
    await expect(page.locator('#root')).toBeVisible();

    // Check for any console errors
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log(`Error text: "${msg.text()}"`);
        }
    });
});
