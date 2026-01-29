import { test, expect } from '@playwright/test';

test('help page content and diagnostics', async ({ page }) => {
    await page.goto('/');

    // Navigate to Help
    const helpBtn = page.locator('#nav-help');
    await expect(helpBtn).toBeVisible();
    await helpBtn.click();

    // Verify Title
    await expect(
        page.getByText(/How to use THE GEAR|Kako koristiti THE GEAR/i)
    ).toBeVisible();

    // Check system diagnostics
    await expect(
        page.getByText(/System Diagnostics|Sistemska dijagnostika/i)
    ).toBeVisible();

    // Check VR Quick Start section
    await expect(
        page.getByText(/VR Mode Quick Start|Uputstvo za VR režim/i)
    ).toBeVisible();
});
