import { test, expect } from '@playwright/test';

test('help page and FAQ search', async ({ page }) => {
    await page.goto('/');

    // Navigate to Help
    const helpBtn = page.locator('#nav-help');
    await expect(helpBtn).toBeVisible();
    await helpBtn.click();

    // Verify Title
    await expect(page.getByText(/Help Center|Centar za pomoć/i)).toBeVisible();

    // Check for FAQ items
    const faqSearch = page.getByPlaceholder(/Search for help topics|Pretražite teme za pomoć/i);
    await expect(faqSearch).toBeVisible();

    // Search for something (e.g., "VR")
    await faqSearch.fill('VR');

    // Check if any results appear or if the search input works
    await expect(faqSearch).toHaveValue('VR');

    // Check system diagnostics
    await expect(page.getByText(/System Health|Status sistema/i)).toBeVisible();
    await expect(page.getByText(/Network Latency|Mrežno kašnjenje/i)).toBeVisible();
});
