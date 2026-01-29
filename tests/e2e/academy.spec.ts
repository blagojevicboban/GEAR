import { test, expect } from '@playwright/test';

test('academy page functionality', async ({ page }) => {
    await page.goto('/');

    // Navigate to Academy
    const academyBtn = page.locator('#nav-academy');
    await expect(academyBtn).toBeVisible();
    await academyBtn.click();

    // Verify Title
    await expect(page.getByText('GEAR Academy')).toBeVisible();

    // Check Categories are visible
    const basicsBtn = page.getByRole('button', { name: /Basics|Osnove/i });
    const creationBtn = page.getByRole('button', {
        name: /Creation|Kreiranje/i,
    });
    const pedagogyBtn = page.getByRole('button', {
        name: /Pedagogy|Pedagogija/i,
    });

    await expect(basicsBtn).toBeVisible();
    await expect(creationBtn).toBeVisible();
    await expect(pedagogyBtn).toBeVisible();

    // Verify Basics Content (Default)
    await expect(page.getByText('Installing GEAR Locally')).toBeVisible();
    await expect(page.getByText('Navigating the 3D Repo')).toBeVisible();

    // Switch categories and verify content
    await creationBtn.click();
    await expect(creationBtn).toHaveClass(/bg-indigo-600/);
    await expect(page.getByText('Creating Your First Lesson')).toBeVisible();
    await expect(page.getByText('Adding Interactive Hotspots')).toBeVisible();

    await pedagogyBtn.click();
    await expect(pedagogyBtn).toHaveClass(/bg-indigo-600/);
    await expect(page.getByText("Bloom's Taxonomy in VR")).toBeVisible();
    await expect(page.getByText('Flipped Classroom with GEAR')).toBeVisible();
});
