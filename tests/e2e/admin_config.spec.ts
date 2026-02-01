import { test, expect } from '@playwright/test';

test('admin configuration and branding update', async ({ page }) => {
    await page.goto('/');

    // Navigate to Login
    await page.locator('#nav-login').click();

    // Login as Admin
    await page.getByPlaceholder(/@/i).first().fill('boban@example.com');
    await page.getByPlaceholder('••••••••').fill('admin123');
    await page.locator('form button[type="submit"]').click();

    // Navigate to Admin Settings
    await page.locator('#nav-admin-settings').click();

    // Go to Configuration Tab
    await page.locator('#admin-tab-config').click();

    // Change Platform Name
    const newBrandName = 'TEST PLATFORM ' + Math.floor(Math.random() * 1000);
    await page.locator('#config-brand-name').fill(newBrandName);

    // Save
    await page.locator('#config-save-btn').click();

    // Wait for success toast / alert if exists, or just wait for save to complete
    await page.waitForTimeout(2000);

    // Verify change in Navbar
    const navbarBrand = page.locator('#navbar-logo-text');
    await expect(navbarBrand).toHaveText(newBrandName);

    // Verify footer change (optional but good)
    const footerBrand = page.locator('#footer-brand-name');
    await expect(footerBrand).toContainText(newBrandName);

    // Cleanup: Change back to THE GEAR
    await page.locator('#config-brand-name').fill('THE GEAR');
    await page.locator('#config-save-btn').click();
    await page.waitForTimeout(1000);
});
