import { test, expect } from '@playwright/test';

test('i18n language switching', async ({ page }) => {
    await page.goto('/');

    // Default language is likely English or based on browser, but let's check titles.
    // The logo text "THE GEAR" is constant, but the subtitle changes.

    // Check for English text
    await expect(page.getByText('Global Educational AR/VR Hub')).toBeVisible();

    // Find language toggle button. In Navbar it has title=t('nav.language')
    // and displays 'EN' or 'SR'.
    const langToggle = page.locator(
        'button:has-text("EN"), button:has-text("SR")'
    );
    await expect(langToggle).toBeVisible();

    const currentLang = await langToggle.innerText();

    if (currentLang === 'EN') {
        // Switch to Serbian
        await langToggle.click();
        await expect(langToggle).toHaveText('SR');
        // Check for Serbian text in Navbar - use regex to be flexible
        await expect(page.locator('#nav-repo')).toHaveText(/Biblioteka/);
        await expect(page.locator('#nav-lessons')).toHaveText(/Lekcije/);
    } else {
        // Switch to English
        await langToggle.click();
        await expect(langToggle).toHaveText('EN');
        // Check for English text in Navbar
        await expect(page.locator('#nav-repo')).toHaveText(/Library/);
        await expect(page.locator('#nav-lessons')).toHaveText(/Lessons/);
    }
});
