import { test, expect } from '@playwright/test';
import path from 'path';

const artifactsDir = '/home/mejkers/.gemini/antigravity/brain/4b88a8fa-840c-4ef4-86b1-b70b340d6f6d';

test('interactive navigation flow', async ({ page }) => {
    // 1. Go to Home
    await page.goto('/');
    await expect(page).toHaveTitle(/THE GEAR/);

    // Screenshot Home
    await page.screenshot({ path: path.join(artifactsDir, 'home_page.png') });
    console.log('Captured home_page.png');

    // 2. Click "Explore Hub"
    // Verify button is visible before clicking
    const exploreBtn = page.getByRole('button', { name: 'Explore Hub' });
    await expect(exploreBtn).toBeVisible();
    await exploreBtn.click();

    // 3. Verify Gallery Load
    // The gallery likely has a grid or some "Filter" options.
    // We'll wait for a small stability period.
    await page.waitForTimeout(2000);

    // Screenshot Gallery
    await page.screenshot({ path: path.join(artifactsDir, 'gallery_page.png') });
    console.log('Captured gallery_page.png');
});
