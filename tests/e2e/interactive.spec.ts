import { test, expect } from '@playwright/test';

test('interactive navigation flow', async ({ page }) => {
    // 1. Go to Home
    await page.goto('/');
    await expect(page).toHaveTitle(/THE GEAR/);

    // 2. Click "Get Started" (used to be Explore Hub)
    // We use regex for flexibility between EN/SR
    const exploreBtn = page.getByRole('button', {
        name: /Get Started|Započni/i,
    });
    await expect(exploreBtn).toBeVisible();
    await exploreBtn.click();

    // 3. Verify Gallery Load
    // Expect "VET Equipment Repository" or Serbian translation
    await expect(
        page.getByText(/VET Equipment Repository|Repozitorijum VET opreme/i)
    ).toBeVisible();

    // 4. Click a model (e.g., the first one in the gallery)
    // The gallery items likely have a "Quick View" or "Explore" button.
    const quickViewBtn = page.getByText(/Quick View|Brzi pregled/i).first();
    if (await quickViewBtn.isVisible()) {
        await quickViewBtn.click();
        // Look for model name or "Back" button
        await expect(
            page.getByRole('button', { name: /Back|Nazad/i })
        ).toBeVisible();
    }
});
